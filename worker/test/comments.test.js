import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeD1 } from './fake-d1.js';
import { handleComments } from '../src/comments.js';
const nowSec=10000;
function fixture() {
 const db=createFakeD1();
 const deps={db, nowSec, rawBase:'https://example.test/',fetchFn:async()=>Response.json({modules:[{id:'color',title:'色彩',file:'playground.src.html',line:1}]})};
 const call=(method='GET',body,caller='yishan',path='')=>handleComments({},new Request('https://example.test/design/api/comments'+path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),caller,deps);
 const insert=(mod='color',created=nowSec,author='yishan')=>db.prepare('INSERT INTO comments (mod,author,body,created_at) VALUES (?,?,?,?)').bind(mod,author,'test-comment',created).run();
 return {db,deps,call,insert};
}
test('test_create_and_list',async()=>{const f=fixture();const r=await f.call('POST',{mod:'color',body:'  test-comment  '});assert.equal(r.status,201);const {comments}=await (await f.call()).json();assert.equal(comments[0].body,'test-comment');assert.equal(comments[0].module.title,'色彩');assert.equal(comments[0].author,'yishan');});
test('test_unknown_module_400',async()=>assert.equal((await fixture().call('POST',{mod:'unknown',body:'test-comment'})).status,400));
test('test_body_validation',async()=>{for(const body of [' ', 'x'.repeat(2001)])assert.equal((await fixture().call('POST',{mod:'color',body})).status,400);});
test('test_agent_cannot_create_or_delete',async()=>{const f=fixture();await f.insert();assert.equal((await f.call('POST',{mod:'color',body:'test-comment'},'agent')).status,403);assert.equal((await f.call('DELETE',{},'agent','/1')).status,403);});
test('test_only_author_deletes',async()=>{const f=fixture();await f.insert();assert.equal((await f.call('DELETE',{},'yingrui','/1')).status,403);assert.equal((await f.call('DELETE',{},'yishan','/1')).status,200);assert.equal((await (await f.call()).json()).comments.length,0);});
test('test_resolve_requires_repo_commit_url',async()=>{
 const f=fixture();await f.insert();assert.equal((await f.call('PATCH',{status:'resolved',commit_url:'https://example.test/commit/test'},'agent','/1')).status,400);
 const url='https://github.com/YishanCoding/jujubit-design-system/commit/test-fake';
 const r=await f.call('PATCH',{status:'resolved',commit_url:url},'agent','/1');assert.equal(r.status,200);
 const c=await r.json();assert.equal(c.resolved_by,'agent');assert.equal(c.resolved_at,nowSec);assert.equal(c.commit_url,url);
 assert.equal((await (await f.call()).json()).comments.length,0);
 assert.equal((await (await f.call('PATCH',{status:'open'},'yingrui','/1')).json()).resolved_at,null);
});
test('test_purge_deletes_orphans',async()=>{const f=fixture();await f.insert('old.mod',nowSec-1000);assert.equal((await (await f.call()).json()).comments.length,0);});
test('test_purge_respects_grace',async()=>{const f=fixture();await f.insert('old.mod',nowSec-60);const d=await (await f.call()).json();assert.equal(d.comments.length,1);assert.equal(d.comments[0].module,null);});
test('test_purge_skipped_on_mass_delete',async()=>{const f=fixture();for(let i=0;i<10;i++)await f.insert(i<6?'old.mod':'color',nowSec-1000);const d=await(await f.call()).json();assert.equal(d.comments.length,10);assert.ok(d.purge_skipped);});
test('test_purge_skipped_when_manifest_unavailable',async()=>{
 for (const fetchFn of [async()=>new Response('',{status:404}),async()=>new Response('not-json'),async()=>Response.json({modules:[]})]) {
 const f=fixture();f.deps.fetchFn=fetchFn;await f.insert('old.mod',nowSec-1000);const d=await(await f.call()).json();assert.equal(d.comments.length,1);assert.ok(d.purge_skipped);
 assert.equal((await f.call('POST',{mod:'color',body:'test-comment'})).status,400);
 }
});
