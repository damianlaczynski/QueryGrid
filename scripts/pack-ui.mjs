import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "artifacts", "npm");
mkdirSync(dest, { recursive: true });

execSync(`npm pack --pack-destination "${dest}"`, {
  cwd: join(root, "src", "npm", "packages", "ui", "dist"),
  stdio: "inherit",
});
