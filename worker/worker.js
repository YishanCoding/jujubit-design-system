// playverseai.com/design* → 实时读取 GitHub 仓库 main 分支（公开仓库，无需密钥）。
// 仓库 push 后，GitHub raw 缓存约 5 分钟，这里再缓存 60 秒。
const RAW = "https://raw.githubusercontent.com/YishanCoding/jujubit-design-system/main/";
const TYPES = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8",
  md: "text/markdown; charset=utf-8", sh: "text/plain; charset=utf-8", txt: "text/plain; charset=utf-8",
  yaml: "text/plain; charset=utf-8", json: "application/json", svg: "image/svg+xml", png: "image/png",
  jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", mp4: "video/mp4",
  ttf: "font/ttf", woff: "font/woff", woff2: "font/woff2", zip: "application/zip",
};
const ALLOWED = /^(playground\.html|tokens\.css|components\.css|install\.sh|(assets|skill|downloads)\/[A-Za-z0-9_\-./]+)$/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/design") return Response.redirect(url.origin + "/design/" + url.search, 301);
    let path = decodeURIComponent(url.pathname.replace(/^\/design\/?/, ""));
    if (path === "" || path === "index.html") path = "playground.html";
    if (!ALLOWED.test(path) || path.includes("..")) return new Response("Not Found", { status: 404 });
    const upstream = await fetch(RAW + path, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!upstream.ok) return new Response("Not Found", { status: 404 });
    const ext = path.split(".").pop().toLowerCase();
    const headers = new Headers({
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": "noindex",
      "Access-Control-Allow-Origin": "*",
    });
    if (ext === "zip") headers.set("Content-Disposition", 'attachment; filename="jujubit-design-system-skill.zip"');
    return new Response(upstream.body, { status: 200, headers });
  },
};
