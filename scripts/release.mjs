import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = new Set(process.argv.slice(2));
const flags = {
  dryRun: args.has("--dry-run"),
  skipTests: args.has("--skip-tests"),
  skipTag: args.has("--skip-tag"),
  skipNpm: args.has("--skip-npm"),
  skipRelease: args.has("--skip-github-release"),
  help: args.has("--help") || args.has("-h"),
};

if (flags.help) {
  console.log(`Usage: npm run release [-- options]

Options:
  --dry-run              Print steps without executing (overrides RELEASE_DRY_RUN=false)
  --skip-tests           Skip npm run test:all
  --skip-tag             Do not create or push git tag (NuGet CI won't run)
  --skip-npm             Skip npm publish
  --skip-github-release  Skip gh release create

Reads configuration from .env in the repository root.
NuGet packages are published by CI when the git tag is pushed (trusted publishing on nuget.org).
`);
  process.exit(0);
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function envBool(value, fallback = false) {
  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function readVersion() {
  const propsPath = join(root, "src", "dotnet", "Directory.Build.props");
  const content = readFileSync(propsPath, "utf8");
  const match = content.match(/<Version>([^<]+)<\/Version>/);
  if (!match) {
    throw new Error(`Could not read <Version> from ${propsPath}`);
  }

  return match[1].trim();
}

function extractChangelogNotes(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const header = `## ${version}`;
  const start = lines.findIndex((line) => line.startsWith(header));
  if (start === -1) {
    return null;
  }

  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      break;
    }

    body.push(lines[i]);
  }

  const notes = body.join("\n").trim();
  return notes || null;
}

function run(command, options = {}) {
  const { dryRun = false, env = {}, cwd = root, stdio = "inherit" } = options;
  if (dryRun) {
    console.log(`[dry-run] ${command}`);
    return "";
  }

  return execSync(command, {
    cwd,
    stdio,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

function commandExists(name) {
  const check = process.platform === "win32" ? "where" : "which";
  return spawnSync(check, [name], { stdio: "ignore" }).status === 0;
}

function assertGitClean(dryRun) {
  const status = run("git status --porcelain", { dryRun, stdio: "pipe" }).trim();
  if (status) {
    throw new Error(
      "Working tree is not clean. Commit or stash changes before releasing.\n"
      + status,
    );
  }
}

function assertTagMissing(tag, dryRun) {
  if (dryRun) {
    return;
  }

  const existing = run(`git tag -l ${tag}`, { stdio: "pipe" }).trim();
  if (existing) {
    throw new Error(`Git tag ${tag} already exists.`);
  }
}

function npmArtifactPaths(version) {
  const dir = join(root, "artifacts", "npm");
  return [
    join(dir, `query-grid-core-${version}.tgz`),
    join(dir, `query-grid-primeng-${version}.tgz`),
    join(dir, `query-grid-ui-${version}.tgz`),
  ];
}

function assertArtifacts(version, dryRun) {
  if (dryRun) {
    return;
  }

  const missing = npmArtifactPaths(version).filter((path) => !existsSync(path));
  if (missing.length > 0) {
    throw new Error(`Missing npm artifacts:\n${missing.map((p) => `- ${p}`).join("\n")}`);
  }
}

const fileEnv = loadEnvFile(join(root, ".env"));
const env = { ...fileEnv, ...process.env };
const dryRun = flags.dryRun || envBool(env.RELEASE_DRY_RUN, false);
const version = readVersion();
const tag = `v${version}`;
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const releaseNotes = extractChangelogNotes(changelog, version);

if (!releaseNotes) {
  throw new Error(`CHANGELOG.md has no section for version ${version}. Add "## ${version} — YYYY-MM-DD" first.`);
}

const npmToken = env.NPM_TOKEN;
const npmTag = env.NPM_TAG || "preview";
const githubToken = env.GITHUB_TOKEN;
const createRelease = !flags.skipRelease && envBool(env.RELEASE_CREATE_GITHUB_RELEASE, true);
const prerelease = envBool(env.RELEASE_PRERELEASE, version.includes("-"));

console.log(`QueryGrid release ${version}${dryRun ? " (dry-run)" : ""}`);
console.log(`Tag: ${tag}`);
console.log("");

if (!flags.skipNpm && !npmToken) {
  throw new Error("NPM_TOKEN is required in .env (or environment) unless --skip-npm is set.");
}

if (createRelease && !flags.skipRelease) {
  if (!commandExists("gh")) {
    throw new Error("GitHub CLI (gh) is required for release notes. Install gh or pass --skip-github-release.");
  }

  if (!githubToken && !dryRun) {
    console.warn("Warning: GITHUB_TOKEN not set — gh will use existing gh auth login session.");
  }
}

assertGitClean(dryRun);

if (!flags.skipTests) {
  console.log("→ Running tests…");
  run("npm run test:all", { dryRun });
}

console.log("→ Packing NuGet and npm artifacts…");
run("npm run pack:backend", { dryRun });
run("npm run pack:npm", { dryRun });
assertArtifacts(version, dryRun);

if (!flags.skipTag) {
  console.log(`→ Creating tag ${tag}…`);
  assertTagMissing(tag, dryRun);
  run(`git tag -a ${tag} -m "Release ${version}"`, { dryRun });
  console.log(`→ Pushing ${tag} (triggers NuGet publish on nuget.org + GitHub Packages)…`);
  run(`git push origin ${tag}`, { dryRun });
}

if (!flags.skipNpm) {
  console.log(`→ Publishing npm packages (@${npmTag})…`);
  for (const artifact of npmArtifactPaths(version)) {
    const fileName = artifact.split(/[/\\]/).pop();
    const npmEnv = {
      ...process.env,
      "NPM_CONFIG_//registry.npmjs.org/:_authToken": npmToken,
    };
    run(
      `npm publish "${artifact}" --access public --tag ${npmTag}`,
      {
        dryRun,
        env: npmEnv,
      },
    );
    if (!dryRun) {
      console.log(`  published ${fileName}`);
    }
  }
}

if (createRelease) {
  console.log(`→ Creating GitHub release ${tag}…`);
  const notesFile = join(
    dryRun ? root : mkdtempSync(join(tmpdir(), "querygrid-release-")),
    "release-notes.md",
  );

  if (!dryRun) {
    writeFileSync(notesFile, releaseNotes, "utf8");
  }

  const prereleaseFlag = prerelease ? " --prerelease" : "";
  const ghEnv = githubToken ? { GH_TOKEN: githubToken, GITHUB_TOKEN: githubToken } : {};
  run(`gh release create ${tag} --title "${tag}" --notes-file "${notesFile}"${prereleaseFlag}`, {
    dryRun,
    env: ghEnv,
  });

  if (!dryRun && notesFile.includes(tmpdir())) {
    rmSync(dirname(notesFile), { recursive: true, force: true });
  }
}

console.log("");
console.log(dryRun ? "Dry-run complete. Re-run without --dry-run to publish." : "Release complete.");
if (!flags.skipTag) {
  console.log(`NuGet: https://www.nuget.org/packages/QueryGrid.EntityFrameworkCore/${version}`);
}
if (!flags.skipNpm) {
  console.log(`npm:  @query-grid/core@${version} (tag: ${npmTag})`);
}
