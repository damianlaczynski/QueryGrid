import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = new Set(process.argv.slice(2));
const flags = {
  dryRun: args.has("--dry-run"),
  skipTests: args.has("--skip-tests"),
  help: args.has("--help") || args.has("-h"),
};

if (flags.help) {
  console.log(`Usage: npm run release [-- options]

Creates and pushes a git tag. CI publishes everything on tag push:
  - NuGet → nuget.org (trusted publishing) + GitHub Packages
  - npm → npmjs.com
  - GitHub Release from CHANGELOG.md

Options:
  --dry-run     Print steps without executing
  --skip-tests  Skip npm run test:all

Prerequisites:
  - Clean git working tree
  - CHANGELOG.md section for the current version
  - GitHub secrets: NUGET_USER, NPM_TOKEN
  - nuget.org trusted publishing policy for publish.yml
`);
  process.exit(0);
}

function loadEnvFile(path) {
  const env = {};
  if (!existsSync(path)) {
    return env;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
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

  return body.join("\n").trim() || null;
}

function run(command, { dryRun = false, stdio = "inherit" } = {}) {
  if (dryRun) {
    console.log(`[dry-run] ${command}`);
    return "";
  }

  return execSync(command, { cwd: root, stdio, encoding: "utf8" });
}

const fileEnv = loadEnvFile(join(root, ".env"));
const dryRun = flags.dryRun || envBool(fileEnv.RELEASE_DRY_RUN, false);
const version = readVersion();
const tag = `v${version}`;
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");

if (!extractChangelogNotes(changelog, version)) {
  throw new Error(`CHANGELOG.md has no section for version ${version}. Add "## ${version} — YYYY-MM-DD" first.`);
}

console.log(`QueryGrid release ${version}${dryRun ? " (dry-run)" : ""}`);
console.log(`Tag ${tag} → CI publishes NuGet, npm, and GitHub Release`);
console.log("");

const status = run("git status --porcelain", { dryRun, stdio: "pipe" }).trim();
if (status) {
  throw new Error(`Working tree is not clean. Commit or stash changes before releasing.\n${status}`);
}

if (!flags.skipTests) {
  console.log("→ Running tests…");
  run("npm run test:all", { dryRun });
}

const existing = run(`git tag -l ${tag}`, { dryRun, stdio: "pipe" }).trim();
if (existing) {
  throw new Error(`Git tag ${tag} already exists. Bump the version or delete the tag first.`);
}

console.log(`→ Creating tag ${tag}…`);
run(`git tag -a ${tag} -m "Release ${version}"`, { dryRun });
console.log(`→ Pushing ${tag}…`);
run(`git push origin ${tag}`, { dryRun });

console.log("");
console.log(dryRun ? "Dry-run complete." : "Tag pushed. Watch the Publish workflow in GitHub Actions.");
console.log(`https://github.com/${fileEnv.GITHUB_OWNER || "damianlaczynski"}/${fileEnv.GITHUB_REPO || "QueryGrid"}/actions`);
