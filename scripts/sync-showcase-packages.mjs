import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const showcaseGrid = join(root, "samples/showcase-ui/node_modules/@query-grid");

const targets = [
  {
    name: "core",
    from: join(root, "src/npm/packages/core"),
    to: join(showcaseGrid, "core"),
  },
  {
    name: "primeng",
    from: join(root, "src/npm/packages/primeng/dist"),
    to: join(showcaseGrid, "primeng"),
  },
];

if (!existsSync(showcaseGrid)) {
  console.error(
    "Missing samples/showcase-ui/node_modules/@query-grid — run: npm run install:showcase-ui",
  );
  process.exit(1);
}

for (const { name, from, to } of targets) {
  if (!existsSync(from)) {
    console.warn(`skip @query-grid/${name}: ${from} not built yet`);
    continue;
  }

  cpSync(from, to, { recursive: true, force: true });
  console.log(`synced @query-grid/${name}`);
}
