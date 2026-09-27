import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative, isAbsolute, extname, sep } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
const prefix = "/IAE-AI-Hub/";
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/") { response.writeHead(302, { Location: `.${prefix}` }); response.end(); return; }
    if (!url.pathname.startsWith(prefix)) throw new Error("Not found");
    const name = decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html";
    if (!(name === "index.html" || name.startsWith("assets/") || name === "public/favicon.svg")) throw new Error("Not found");
    const path = resolve(root, name);
    const rel = relative(root, path);
    if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) throw new Error("Not found");
    const content = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(content);
  } catch { response.writeHead(404); response.end("Not found"); }
}).listen(4173, "127.0.0.1", () => console.log("미리보기: http://127.0.0.1:4173/IAE-AI-Hub/ (종료: Ctrl+C)"));
