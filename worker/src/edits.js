import { json, readJson, HttpError } from './http.js';
const CONTENTS='https://api.github.com/repos/YishanCoding/jujubit-design-system/contents/playground.src.html?ref=main';
const NAMES={yishan:'Yishan',yingrui:'莹睿'};
export function sanitizeInline(html) {
 const entities={amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:'\u00a0'};
 return html.split(/(<[^>]*>)/g).map(part=>{
  if(part.startsWith('<') && part.endsWith('>')) {
   if(/^<\/?(?:b|code)>$/.test(part) || part==='<br>') return part;
   return /^<br\s*\/>$/.test(part)?'<br>':'';
  }
  return part.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|nbsp);/gi,(entity,name)=>{
   if(Object.hasOwn(entities,name)) return entities[name];
   if(name[0]!=='#') return entity;
   const n=/^#x/i.test(name)?parseInt(name.slice(2),16):parseInt(name.slice(1),10);
   return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff)?String.fromCodePoint(n):'\ufffd';
  }).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 }).join('').trim();
}
export function applyEdits(src,edits) {
 const results=[];
 for(const {key,source,html} of edits) {
  const start=source?src.indexOf(source):-1;
  const clean=sanitizeInline(html);
  const error=start<0?'not_found':src.indexOf(source,start+1)>=0?'ambiguous':!clean?'empty':clean===source?'unchanged':null;
  if(error) {results.push({key,ok:false,error});continue;}
  src=src.slice(0,start)+clean+src.slice(start+source.length);
  results.push({key,ok:true,new_source:clean});
 }
 return {src,results};
}
function decode(value) {return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
function encode(value) {
 const bytes=new TextEncoder().encode(value), chunks=[];
 for(let i=0;i<bytes.length;i+=8192) chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
 return btoa(chunks.join(''));
}
export async function commitEdits(env,fetchFn,who,edits) {
 const headers={Authorization:`Bearer ${env.GITHUB_PAT}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'jujubit-design-editor'};
 for(let attempt=0;attempt<2;attempt++) {
  const response=await fetchFn(CONTENTS,{headers});
  if(!response.ok) throw new HttpError(502,'github_unavailable');
  const head=await response.json();
  const {src,results}=applyEdits(decode(head.content),edits);
  if(!results.some(r=>r.ok)) return {commit_url:null,results};
  const modules=new Set(edits.map(e=>e.key.split('#')[0]));
  const title=(edits[0].title || edits[0].key.split('#')[0])+(modules.size>1?`等 ${modules.size} 处`:'');
  const put=await fetchFn(CONTENTS,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({
   message:`网页编辑：${title}（${NAMES[who]}）`,content:encode(src),sha:head.sha,branch:'main',
   author:{name:NAMES[who],email:'design-editor@users.noreply.github.com'},
  })});
  if(put.status===409 || put.status===422) {if(attempt===0) continue;throw new HttpError(409,'conflict');}
  if(!put.ok) throw new HttpError(502,'github_unavailable');
  const data=await put.json();return {commit_url:data.commit.html_url,results};
 }
}
export async function handleEdits(env,request,caller,deps) {
 if(caller==='agent') return json({error:'forbidden'},403);
 if(request.method!=='POST') return json({error:'not_found'},404);
 try {
  const {edits,titles={}}=await readJson(request);
  if(!Array.isArray(edits) || !edits.length || edits.length>50 || !titles || typeof titles!=='object' || Array.isArray(titles)) throw new HttpError(400,'invalid_edits');
  const keys=new Set();
  for(const e of edits) {
   if(!e || typeof e.key!=='string' || !/^[a-z0-9]+(\.[a-z0-9-]+)*#[1-9]\d*$/.test(e.key)
    || typeof e.source!=='string' || !e.source || typeof e.html!=='string' || keys.has(e.key)
    || (Object.hasOwn(titles,e.key) && typeof titles[e.key]!=='string')) throw new HttpError(400,'invalid_edits');
   keys.add(e.key);
  }
  return json(await commitEdits(env,deps.fetchFn,caller,edits.map(e=>({...e,title:titles[e.key] || e.key.split('#')[0]}))));
 } catch(error) {
  if(error instanceof HttpError) return json({error:error.message},error.status);
  throw error;
 }
}
