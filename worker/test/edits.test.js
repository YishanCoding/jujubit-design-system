import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInline,applyEdits,commitEdits,handleEdits } from '../src/edits.js';
const edit=(source='旧文字',html='新文字')=>({key:'color#1',source,html,title:'色彩'});
function github({conflicts=0,source='<h2>旧文字</h2>'}={}) {
 const puts=[], gets=[];
 const fetchFn=async(url,options={})=>{
  assert.ok(url.startsWith('https://api.github.com/repos/YishanCoding/jujubit-design-system/contents/playground.src.html'));
  assert.equal(options.headers.Authorization,'Bearer test-github-pat');
  if(options.method==='PUT') {puts.push(JSON.parse(options.body));return puts.length<=conflicts?new Response('',{status:409}):Response.json({commit:{html_url:'https://github.com/YishanCoding/jujubit-design-system/commit/test-fake'}});}
  gets.push(url);return Response.json({sha:`test-sha-${gets.length}`,content:Buffer.from(source).toString('base64')});
 };
 return {fetchFn,puts,gets};
}
const env={GITHUB_PAT:'test-github-pat'};
test('test_sanitize_whitelist',()=>assert.equal(sanitizeInline('<b>a</b><i>b</i><script>x</script><br/>'),'<b>a</b>bx<br>'));
test('test_sanitize_entities',()=>{assert.equal(sanitizeInline('A &amp; B &lt;c&gt;'),'A &amp; B &lt;c&gt;');assert.equal(sanitizeInline('1 < 2'),'1 &lt; 2');assert.equal(sanitizeInline('&#60;b&#x3e; &quot;x&quot; &#39;y&#39;'),'&lt;b&gt; "x" \'y\'');});
test('test_apply_single',()=>assert.equal(applyEdits('<h2>旧文字</h2>',[edit()]).src,'<h2>新文字</h2>'));
test('test_ambiguous_source_is_rejected_others_commit',async()=>{
 const edits=[edit('same','new'),{key:'color#2',source:'unique',html:'changed',title:'色彩'}];
 const g=github({source:'same same unique'});const result=await commitEdits(env,g.fetchFn,'yishan',edits);
 assert.equal(result.results[0].error,'ambiguous');assert.equal(result.results[1].ok,true);assert.equal(Buffer.from(g.puts[0].content,'base64').toString(),'same same changed');
});
test('test_empty_edit_rejected',()=>assert.equal(applyEdits('旧文字',[edit('旧文字','  ')]).results[0].error,'empty'));
test('test_unchanged_not_committed',async()=>{const g=github();const r=await commitEdits(env,g.fetchFn,'yishan',[edit('旧文字','旧文字')]);assert.equal(r.commit_url,null);assert.equal(r.results[0].error,'unchanged');assert.equal(g.puts.length,0);});
test('test_commit_message_and_author',async()=>{const g=github();await commitEdits(env,g.fetchFn,'yingrui',[edit()]);const p=g.puts[0];assert.equal(p.message,'网页编辑：色彩（莹睿）');assert.deepEqual(p.author,{name:'莹睿',email:'design-editor@users.noreply.github.com'});assert.equal(Buffer.from(p.content,'base64').toString(),'<h2>新文字</h2>');assert.equal(p.branch,'main');});
test('test_retry_on_409',async()=>{const g=github({conflicts:1});await commitEdits(env,g.fetchFn,'yishan',[edit()]);assert.equal(g.gets.length,2);assert.equal(g.puts[1].sha,'test-sha-2');});
test('test_new_source_returned',async()=>{const g=github();const r=await commitEdits(env,g.fetchFn,'yishan',[edit('旧文字','<i>新</i> &amp; 文')]);assert.equal(r.results[0].new_source,'新 &amp; 文');});
test('test_second_conflict_and_invalid_request',async()=>{
 const g=github({conflicts:2});await assert.rejects(commitEdits(env,g.fetchFn,'yishan',[edit()]),e=>e.status===409);
 const req=new Request('https://example.test/design/api/edits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({edits:Array(51).fill(edit())})});
 assert.equal((await handleEdits(env,req,'yishan',{fetchFn:g.fetchFn})).status,400);
 assert.equal((await handleEdits(env,req,'agent',{fetchFn:g.fetchFn})).status,403);
});
