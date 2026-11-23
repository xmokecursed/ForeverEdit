import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const chromeDist = join(root, "dist");
const firefoxDist = join(root, "dist-firefox");

if (!existsSync(chromeDist)) {
  console.error("[build-firefox] dist/ not found - run `npm run build` first.");
  process.exit(1);
}

rmSync(firefoxDist, { recursive: true, force: true });
cpSync(chromeDist, firefoxDist, { recursive: true });

const firefoxManifestSrc = join(firefoxDist, "manifest.firefox.json");
const manifestDest = join(firefoxDist, "manifest.json");

if (!existsSync(firefoxManifestSrc)) {
  console.error("[build-firefox] manifest.firefox.json missing from dist/ - check public/manifest.firefox.json exists.");
  process.exit(1);
}

writeFileSync(manifestDest, readFileSync(firefoxManifestSrc, "utf8"));
rmSync(firefoxManifestSrc);
rmSync(join(chromeDist, "manifest.firefox.json"), { force: true });

console.log("[build-firefox] dist-firefox/ ready. Load it via about:debugging in Firefox, or zip it for AMO.");
