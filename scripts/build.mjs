import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
await mkdir("assets", { recursive: true });
await build({
  entryPoints: ["app/main.tsx"], outfile: "assets/app.js", bundle: true,
  format: "iife", platform: "browser", target: ["es2020"], minify: true,
  define: { "process.env.NODE_ENV": '"production"' }, legalComments: "eof",
});
const cliPackage = JSON.parse(await readFile("node_modules/@tailwindcss/cli/package.json", "utf8"));
const cli = `node_modules/@tailwindcss/cli/${Object.values(cliPackage.bin)[0]}`;
const css = spawnSync(process.execPath, [cli, "-i", "app/globals.css", "-o", "assets/app.css", "--minify"], { stdio: "inherit" });
if (css.status !== 0) process.exit(css.status ?? 1);
console.log("완료: index.html과 assets 폴더를 함께 게시하세요.");
