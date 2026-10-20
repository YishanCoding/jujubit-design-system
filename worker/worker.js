import { json, HttpError } from './src/http.js';
import { readSession, isAgent, handleLogin, handleLogout } from './src/auth.js';
import { handleComments } from './src/comments.js';
import { handleEdits } from './src/edits.js';
// playverseai.com/design* 和 /brand* → 实时读取 GitHub 仓库 main 分支。
// 仓库是 private，读文件带 GITHUB_PAT（与网页编辑提交共用同一个 worker secret）。
// 仓库 push 后，GitHub raw 缓存约 5 分钟，这里再缓存 60 秒。
const RAW = "https://raw.githubusercontent.com/YishanCoding/jujubit-design-system/main/";
const TYPES = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8",
  md: "text/markdown; charset=utf-8", sh: "text/plain; charset=utf-8", txt: "text/plain; charset=utf-8",
  yaml: "text/plain; charset=utf-8", json: "application/json", svg: "image/svg+xml", png: "image/png",
  jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", mp4: "video/mp4",
  ttf: "font/ttf", woff: "font/woff", woff2: "font/woff2", zip: "application/zip",
};
const BRAND_ALLOWED = /^brand\/[A-Za-z0-9_\-./]+$/;
const ALLOWED = /^(playground\.html|dashboard\.html|tokens\.css|components\.css|install\.sh|modules\.json|editor\/[A-Za-z0-9_\-.]+|(assets|skill|downloads)\/[A-Za-z0-9_\-./]+)$/;

export function injectEditor(response, Rewriter = HTMLRewriter) {
  return new Rewriter().on('body', {
    element(element) { element.append('<link rel="stylesheet" href="editor/editor.css"><script src="editor/editor.js" defer></script>', {html:true}); },
  }).transform(response);
}

export async function route(request, env, deps = {}) {
  const url = new URL(request.url);
  const fetchFn = deps.fetchFn || fetch;
  const nowSec = deps.nowSec ?? Math.floor(Date.now()/1000);
  const rawBase = env.RAW_BASE || RAW;
  const rawFetch = (u, init = {}) => fetchFn(u, env.GITHUB_PAT && String(u).startsWith(rawBase)
    ? { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${env.GITHUB_PAT}` } } : init);
  if (url.pathname.startsWith('/design/api/')) {
    try {
      const path = url.pathname.slice('/design/api/'.length);
      const method = request.method;
      const known = (path === 'login' && method === 'POST') || (path === 'logout' && method === 'POST')
        || (path === 'me' && method === 'GET') || (path === 'edits' && method === 'POST')
        || (path === 'comments' && ['GET','POST'].includes(method))
        || (/^comments\/[1-9]\d*$/.test(path) && ['PATCH','DELETE'].includes(method));
      if (!known) return json({error:'not_found'},404);
      if (path === 'login') return await handleLogin(env,request,request.headers.get('CF-Connecting-IP') || '0.0.0.0',nowSec);
      const caller = (await isAgent(env,request)) ? 'agent' : await readSession(env,request,nowSec);
      if (!caller) return json({error:'unauthorized'},401);
      if (caller === 'agent' && !((path === 'comments' && method === 'GET') || (/^comments\/[1-9]\d*$/.test(path) && method === 'PATCH'))) return json({error:'forbidden'},403);
      if (['POST','PATCH','DELETE'].includes(method) && request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({error:'unsupported_media_type'},415);
      if (path === 'me') return json({who:caller});
      if (path === 'logout') return handleLogout();
      const context = {db:env.DB,fetchFn:rawFetch,rawBase,nowSec};
      if (path === 'edits') return await handleEdits(env,request,caller,context);
      return await handleComments(env,request,caller,context);
    } catch (error) {
      // Never log request bodies, cookies, credentials or upstream error payloads.
      return json({error:error instanceof HttpError ? error.message : 'internal_error'}, error instanceof HttpError ? error.status : 500);
    }
  }
  if (url.pathname === "/brand" || url.pathname.startsWith("/brand/")) {
    let p = url.pathname === "/brand" || url.pathname === "/brand/" ? "brand/index.html" : url.pathname.slice(1);
    try { p = decodeURIComponent(p); } catch { return new Response('Not Found', {status:404}); }
    if (!BRAND_ALLOWED.test(p) || p.includes("..")) return new Response("Not Found", { status: 404 });
    return serveRaw(p);
  }
  if (url.pathname === "/design") return Response.redirect(url.origin + "/design/" + url.search, 301);
  if (!url.pathname.startsWith('/design/')) return new Response('Not Found', {status:404});
  let path;
  try { path = decodeURIComponent(url.pathname.slice('/design/'.length)); }
  catch { return new Response('Not Found', {status:404}); }
  if (path === "" || path === "index.html") path = "playground.html";
  if (path === "dashboard/") return Response.redirect(url.origin + "/design/dashboard" + url.search, 301);
  if (path === "dashboard") path = "dashboard.html";
  if (!ALLOWED.test(path) || path.includes("..")) return new Response("Not Found", { status: 404 });
  const response = await serveRaw(path);
  if (response.status !== 200) return response;
  return path === 'playground.html' ? (deps.injectEditor || injectEditor)(response) : response;

  async function serveRaw(path) {
    const upstream = await rawFetch(rawBase + path, { cf: { cacheTtl: 60, cacheEverything: true } });
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
  }
}

export default { fetch(request,env) { return route(request,env); } };
