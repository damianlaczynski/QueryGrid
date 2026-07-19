import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, "samples", "showcase-ui", ".angular");

try {
  rmSync(cacheDir, { recursive: true, force: true });
  console.log(`Cleared ${cacheDir}`);
} catch (error) {
  console.warn(`Could not clear showcase cache: ${error.message}`);
}
