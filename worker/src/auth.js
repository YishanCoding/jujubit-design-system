import { json, readJson } from './http.js';
const encoder = new TextEncoder();
const AGE = 2592000;
const ATTRS = 'HttpOnly; Secure; SameSite=Strict; Path=/design';
function equalBytes(a,b) {
 let diff = a.length ^ b.length;
 for(let i=0;i<a.length;i++) diff |= a[i] ^ (b[i] ?? 0);
 return diff===0;
}
async function equalSecret(a,b) {
 const digest = value => crypto.subtle.digest('SHA-256',encoder.encode(value));
 const [x,y] = await Promise.all([digest(a),digest(b)]);
 return equalBytes(new Uint8Array(x),new Uint8Array(y));
}
function b64url(bytes) { return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''); }
function unbase64(value) { return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),x=>x.charCodeAt(0)); }
async function signature(env,payload) {
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.SESSION_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload)));
}
export async function matchPassword(env,pass) {
 if(typeof pass!=='string') return null;
 const a=await equalSecret(pass,env.EDIT_PASS_YISHAN || '');
 const b=await equalSecret(pass,env.EDIT_PASS_YINGRUI || '');
 if(env.EDIT_PASS_YISHAN && a) return 'yishan';
 if(env.EDIT_PASS_YINGRUI && b) return 'yingrui';
 return null;
}
export async function signSession(env,who,nowSec) {
 if(!env.SESSION_KEY) throw new Error('session_not_configured');
 const payload=b64url(encoder.encode(JSON.stringify({who,exp:nowSec+AGE})));
 return payload+'.'+b64url(await signature(env,payload));
}
export async function readSession(env,request,nowSec) {
 if(!env.SESSION_KEY) return null;
 try {
  const value=(request.headers.get('Cookie') || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('jjb_edit='))?.slice(9);
  if(!value) return null;
  const parts=value.split('.');if(parts.length!==2) return null;
  const [payload,sig]=parts;
  if(!equalBytes(await signature(env,payload),unbase64(sig))) return null;
  const {who,exp}=JSON.parse(new TextDecoder().decode(unbase64(payload)));
  return ['yishan','yingrui'].includes(who) && Number.isFinite(exp) && exp>nowSec ? who : null;
 } catch {return null;}
}
export async function isAgent(env,request) {
 if(!env.AGENT_TOKEN) return false;
 const header=request.headers.get('Authorization') || '';
 return header.startsWith('Bearer ') && equalSecret(header.slice(7),env.AGENT_TOKEN);
}
export async function handleLogin(env,request,ip,nowSec) {
 const {pass}=await readJson(request);
 await env.DB.prepare('DELETE FROM login_attempts WHERE ts <= ?').bind(nowSec-1200).run();
 // The fifth failure starts the full ten-minute lock, even with spaced attempts.
 const {results}=await env.DB.prepare('SELECT ts FROM login_attempts WHERE ip = ? ORDER BY ts').bind(ip).all();
 let failures=[];
 for(const {ts} of results) {
  failures=failures.filter(t=>t>ts-600); failures.push(ts);
  if(failures.length>=5 && nowSec<ts+600) return json({error:'rate_limited'},429);
 }
 const who=await matchPassword(env,pass);
 if(!who) {await env.DB.prepare('INSERT INTO login_attempts (ip,ts) VALUES (?,?)').bind(ip,nowSec).run();return json({error:'unauthorized'},401);}
 await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
 return json({who},200,{'Set-Cookie':`jjb_edit=${await signSession(env,who,nowSec)}; ${ATTRS}; Max-Age=${AGE}`});
}
export function handleLogout() {return json({ok:true},200,{'Set-Cookie':`jjb_edit=; ${ATTRS}; Max-Age=0`});}
