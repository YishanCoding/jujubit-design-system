import test from 'node:test';
import assert from 'node:assert/strict';
import { route, injectEditor } from '../worker.js';
import { signSession } from '../src/auth.js';
import { createFakeD1 } from './fake-d1.js';
const env=()=>({DB:createFakeD1(),AGENT_TOKEN:'test-agent-token',SESSION_KEY:'test-session-key'});
const request=(path,method='GET',headers={},body)=>new Request('https://example.test/design/'+path,{method,headers,...(body===undefined?{}:{body})});
const deps={nowSec:1000,fetchFn:async()=>new Response('test-static'),injectEditor:r=>r};
test('test_api_requires_auth_401',async()=>assert.equal((await route(request('api/comments'),env(),deps)).status,401));
test('test_api_no_cors_header',async()=>{const r=await route(request('api/comments'),env(),deps);assert.equal(r.headers.get('access-control-allow-origin'),null);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('content-type'),'application/json');});
test('test_static_still_served',async()=>{const r=await route(request('tokens.css'),env(),deps);assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'*');assert.equal(await r.text(),'test-static');});
test('test_agent_cannot_post_edits',async()=>assert.equal((await route(request('api/edits','POST',{Authorization:'Bearer test-agent-token','Content-Type':'application/json'},'{}'),env(),deps)).status,403));
test('test_post_requires_json_415',async()=>{const e=env();const cookie=await signSession(e,'yishan',1000);assert.equal((await route(request('api/comments','POST',{Cookie:`jjb_edit=${cookie}`},'{}'),e,deps)).status,415);});
test('test_unknown_api_404',async()=>assert.equal((await route(request('api/unknown'),env(),deps)).status,404));
test('test_inject_only_html_and_raw_override',async()=>{
 let injections=0;const urls=[];const d={...deps,fetchFn:async url=>{urls.push(url);return new Response('test-static');},injectEditor:r=>{injections++;return r;}};
 for(const path of ['','editor/editor.js','modules.json']) assert.equal((await route(request(path),{...env(),RAW_BASE:'http://localhost:8788/'},d)).status,200);
 assert.equal(injections,1);assert.equal(urls[0],'http://localhost:8788/playground.html');
});
test('test_html_rewriter_contract',async()=>{
 let selector,markup,opts;class FakeRewriter {on(s,handler){selector=s;this.handler=handler;return this;}transform(r){this.handler.element({append(m,o){markup=m;opts=o;}});return r;}}
 injectEditor(new Response('test'),FakeRewriter);assert.equal(selector,'body');assert.equal(markup,'<link rel="stylesheet" href="editor/editor.css"><script src="editor/editor.js" defer></script>');assert.deepEqual(opts,{html:true});
});
test('test_brand_route_maps_to_brand_dir',async()=>{
 const urls=[];const d={...deps,fetchFn:async url=>{urls.push(url);return new Response('test-static');}};
 for(const p of ['/brand','/brand/']) {const r=await route(new Request('https://example.test'+p),{...env(),RAW_BASE:'http://localhost:8788/'},d);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'text/html; charset=utf-8');}
 assert.deepEqual(urls,['http://localhost:8788/brand/index.html','http://localhost:8788/brand/index.html']);
 for(const p of ['/brand/../tokens.css','/brandx','/brand/%E0']) assert.equal((await route(new Request('https://example.test'+p),env(),d)).status,404);
});
test('test_raw_fetch_sends_pat_only_to_raw',async()=>{
 const seen=[];const d={...deps,fetchFn:async(url,init={})=>{seen.push([url,init.headers?.Authorization]);return new Response('x');}};
 await route(request('tokens.css'),{...env(),GITHUB_PAT:'test-pat',RAW_BASE:'http://localhost:8788/'},d);
 assert.deepEqual(seen,[['http://localhost:8788/tokens.css','Bearer test-pat']]);
});
test('test_dashboard_route_maps_to_dashboard_html',async()=>{
 const urls=[];const d={...deps,fetchFn:async url=>{urls.push(url);return new Response('test-static');},injectEditor:()=>{throw new Error('dashboard must not inject editor');}};
 for(const p of ['dashboard','dashboard.html']) {const r=await route(request(p),{...env(),RAW_BASE:'http://localhost:8788/'},d);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'text/html; charset=utf-8');}
 assert.deepEqual(urls,Array(2).fill('http://localhost:8788/dashboard.html'));
 assert.equal((await route(request('dashboardx'),env(),d)).status,404);
 const r=await route(request('dashboard/'),env(),d);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://example.test/design/dashboard');
});
