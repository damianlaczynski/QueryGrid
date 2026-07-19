import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "../../node_modules/@laczynski/ui/assets/icons");
const target = resolve(root, "public/assets/icons");

if (!existsSync(source)) {
  console.error(`Icon sprite source not found: ${source}`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Copied laczynski/ui icons to ${target}`);
