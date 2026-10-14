import { json, readJson, HttpError } from './http.js';
const COMMIT_PREFIX = 'https://github.com/YishanCoding/jujubit-design-system/commit/';
export async function loadManifest(fetchFn,rawBase) {
 try {
  const response=await fetchFn(rawBase+'modules.json',{cf:{cacheTtl:60,cacheEverything:true}});
  if(!response.ok) return {ok:false,reason:'manifest_unavailable'};
  const data=await response.json();
  if(!Array.isArray(data.modules) || !data.modules.length) return {ok:false,reason:'manifest_empty'};
  const modules=new Map();
  for(const mod of data.modules) {
   if(!mod || typeof mod.id!=='string' || !/^[a-z0-9]+(\.[a-z0-9-]+)*$/.test(mod.id) || modules.has(mod.id)
      || typeof mod.title!=='string' || mod.file!=='playground.src.html' || !Number.isInteger(mod.line) || mod.line<1) return {ok:false,reason:'manifest_invalid'};
   modules.set(mod.id,{id:mod.id,title:mod.title,file:mod.file,line:mod.line});
  }
  return {ok:true,modules};
 } catch {return {ok:false,reason:'manifest_unavailable'};}
}
export async function purgeOrphans(db,manifest,nowSec) {
 if(!manifest.ok) return {skipped:manifest.reason};
 const {results}=await db.prepare('SELECT id,mod,created_at FROM comments').all();
 const orphans=results.filter(c=>!manifest.modules.has(c.mod) && nowSec-c.created_at>=900);
 if(orphans.length>5 && orphans.length>results.length*0.3) return {skipped:'mass_delete'};
 if(!orphans.length) return {deleted:0};
 const responses=await db.batch(orphans.map(c=>db.prepare('DELETE FROM comments WHERE id = ? AND mod = ? AND created_at <= ?').bind(c.id,c.mod,nowSec-900)));
 return {deleted:responses.reduce((n,r)=>n+r.meta.changes,0)};
}
export async function handleComments(env,request,caller,deps) {
 const {db,fetchFn,rawBase,nowSec}=deps;
 try {
  const url=new URL(request.url), match=url.pathname.match(/^\/design\/api\/comments(?:\/([1-9]\d*))?$/);
  if(!match) return json({error:'not_found'},404);
  const id=match[1]?Number(match[1]):null;
  const method=request.method;
  if(method==='GET' && id===null) {
   const status=url.searchParams.get('status') || 'open';
   if(!['open','resolved','all'].includes(status)) return json({error:'invalid_status'},400);
   const manifest=await loadManifest(fetchFn,rawBase);
   const purge=await purgeOrphans(db,manifest,nowSec);
   const {results}=await db.prepare('SELECT * FROM comments WHERE (? = ? OR status = ?) ORDER BY id').bind(status,'all',status).all();
   const comments=results.map(c=>({...c,module:manifest.ok?(manifest.modules.get(c.mod) || null):null}));
   return json({comments,...(purge.skipped?{purge_skipped:purge.skipped}:{})});
  }
  if(caller==='agent' && method!=='PATCH') return json({error:'forbidden'},403);
  if(method==='POST' && id===null) {
   const {mod,body}=await readJson(request);
   if(typeof body!=='string' || !body.trim() || [...body.trim()].length>2000) return json({error:'invalid_body'},400);
   const manifest=await loadManifest(fetchFn,rawBase);
   if(!manifest.ok) return json({error:'manifest_unavailable'},400);
   if(!manifest.modules.has(mod)) return json({error:'unknown_module'},400);
   const result=await db.prepare('INSERT INTO comments (mod,author,body,created_at) VALUES (?,?,?,?)').bind(mod,caller,body.trim(),nowSec).run();
   return json(await db.prepare('SELECT * FROM comments WHERE id = ?').bind(result.meta.last_row_id).first(),201);
  }
  if(id!==null && ['PATCH','DELETE'].includes(method)) {
   const data=await readJson(request);
   const comment=await db.prepare('SELECT * FROM comments WHERE id = ?').bind(id).first();
   if(!comment) return json({error:'not_found'},404);
   if(method==='DELETE') {
    if(comment.author!==caller) return json({error:'forbidden'},403);
    await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();return json({ok:true});
   }
   const {status,commit_url}=data;
   if(!['open','resolved'].includes(status)) return json({error:'invalid_status'},400);
   if(commit_url!==undefined && (typeof commit_url!=='string' || !commit_url.startsWith(COMMIT_PREFIX))) return json({error:'invalid_commit_url'},400);
   const resolved=status==='resolved';
   await db.prepare('UPDATE comments SET status = ?, resolved_at = ?, resolved_by = ?, commit_url = ? WHERE id = ?')
    .bind(status,resolved?nowSec:null,resolved?caller:null,resolved?(commit_url ?? comment.commit_url):null,id).run();
   return json(await db.prepare('SELECT * FROM comments WHERE id = ?').bind(id).first());
  }
  return json({error:'not_found'},404);
 } catch(error) {
  if(error instanceof HttpError) return json({error:error.message},error.status);
  throw error;
 }
}
