import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const packageDir = resolve(process.argv[2] ?? ".");
const packageJsonPath = join(packageDir, "package.json");
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const saved = {
  main: pkg.main,
  types: pkg.types,
  module: pkg.module,
  typings: pkg.typings,
  exports: pkg.exports,
};

delete pkg.main;
delete pkg.types;
delete pkg.module;
delete pkg.typings;
delete pkg.exports;
writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

try {
  execSync("npx ng-packagr -p ng-package.json", {
    cwd: packageDir,
    stdio: "inherit",
    env: process.env,
  });
} finally {
  const restored = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (saved.main !== undefined) {
    restored.main = saved.main;
  }
  if (saved.types !== undefined) {
    restored.types = saved.types;
  }
  if (saved.module !== undefined) {
    restored.module = saved.module;
  }
  if (saved.typings !== undefined) {
    restored.typings = saved.typings;
  }
  if (saved.exports !== undefined) {
    restored.exports = saved.exports;
  }
  writeFileSync(packageJsonPath, `${JSON.stringify(restored, null, 2)}\n`);
}
