import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeD1 } from './fake-d1.js';
import { handleLogin, signSession, readSession, isAgent } from '../src/auth.js';
const env = () => ({ DB: createFakeD1(), EDIT_PASS_YISHAN: 'test-pass-yishan', EDIT_PASS_YINGRUI: 'test-pass-yingrui', SESSION_KEY: 'test-session-key', AGENT_TOKEN: 'test-agent-token' });
const request = pass => new Request('https://example.test/design/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({pass}) });
const cookieRequest = value => new Request('https://example.test/design/api/me', {headers: {Cookie: `jjb_edit=${value}`}});
test('test_login_ok_sets_cookie', async () => {
 const e=env(), r=await handleLogin(e,request('test-pass-yishan'),'test-ip',1000);
 assert.equal(r.status,200); const cookie=r.headers.get('set-cookie');
 for (const part of ['jjb_edit=','HttpOnly','Secure','SameSite=Strict','Path=/design','Max-Age=2592000']) assert.ok(cookie.includes(part));
 assert.equal(await readSession(e,cookieRequest(cookie.split(';')[0].slice(9)),1000),'yishan');
});
test('test_login_identifies_each_person', async () => { for(const who of ['yishan','yingrui']) assert.deepEqual(await (await handleLogin(env(),request(`test-pass-${who}`),'test-ip',1000)).json(),{who}); });
test('test_login_wrong_401',async()=>assert.equal((await handleLogin(env(),request('test-wrong'),'test-ip',1000)).status,401));
test('test_login_rate_limit', async()=>{
 const e=env();for(let i=0;i<5;i++) assert.equal((await handleLogin(e,request('test-wrong'),'test-ip',1000)).status,401);
 assert.equal((await handleLogin(e,request('test-pass-yishan'),'test-ip',1001)).status,429);
 assert.equal((await handleLogin(e,request('test-pass-yishan'),'test-ip',1601)).status,200);
});
test('test_tampered_cookie_rejected',async()=>{const e=env(), s=await signSession(e,'yishan',1000);assert.equal(await readSession(e,cookieRequest(btoa('{"who":"yingrui","exp":3000000}')+'.'+s.split('.')[1]),1001),null);});
test('test_expired_cookie_rejected',async()=>{const e=env();assert.equal(await readSession(e,cookieRequest(await signSession(e,'yishan',1000)),2593001),null);});
test('test_agent_token',async()=>{
 for (const token of ['test-agent-token','','test-wrong']) assert.equal(await isAgent(env(),new Request('https://example.test',{headers:{Authorization:`Bearer ${token}`}})),token==='test-agent-token');
 assert.equal(await isAgent({},new Request('https://example.test',{headers:{Authorization:'Bearer undefined'}})),false);
});
