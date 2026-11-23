import { existsSync, mkdirSync, cpSync, rmSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

function relocate(name) {
  const from = join(dist, "src", name);
  const to = join(dist, name);
  if (existsSync(from)) {
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true, force: true });
  }
}

relocate("popup");
relocate("options");
rmSync(join(dist, "src"), { recursive: true, force: true });

copyFileSync(join(process.cwd(), "src", "content", "content.css"), join(dist, "content", "content.css"));

console.log("[postbuild] relocated popup/options html and copied content.css");
