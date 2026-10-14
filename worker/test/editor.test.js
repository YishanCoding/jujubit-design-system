import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const script=()=>readFileSync(new URL('../../editor/editor.js',import.meta.url),'utf8');
// Deliberately small DOM fixture: exercises behavior, not visual layout.
function page(respond,location={pathname:'/design/',protocol:'https:'}) {
 const listeners=new Map(), nodes=[];
 class Node {
  constructor(tag='div',text=null){this.tagName=tag.toUpperCase();this.nodeType=text===null?1:3;this.nodeValue=text;this.children=[];this.dataset={};this.attrs={};this.style={};this.events={};this.hidden=false;this.disabled=false;this.value='';this._text='';this.className='';nodes.push(this);this.classList={add:(...v)=>this.className=[...new Set([...this.className.split(' '),...v])].join(' ').trim(),remove:(...v)=>this.className=this.className.split(' ').filter(x=>!v.includes(x)).join(' '),contains:v=>this.className.split(' ').includes(v),toggle:(v,on)=>on?this.classList.add(v):this.classList.remove(v)};}
  get childNodes(){return this.children;}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this.nodeType===3?this.nodeValue:this._text+this.children.map(x=>x.textContent).join('');}
  append(...items){for(let n of items){if(typeof n==='string')n=new Node('#text',n);n.parentElement=this;this.children.push(n);}}
  prepend(n){n.parentElement=this;this.children.unshift(n);}
  replaceChildren(...items){this._text='';this.children=[];this.append(...items);}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.removed=true;}
  setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,f){(this.events[k]??=[]).push(f);}
  async fire(k,extra={}){for(const f of this.events[k]||[])await f({target:this,preventDefault(){},stopPropagation(){},...extra});await new Promise(r=>setImmediate(r));}
  matches(s){if(s==='[data-mod]')return !!this.dataset.mod;if(s==='[data-edit]')return !!this.dataset.edit;if(s.startsWith('.'))return this.classList.contains(s.slice(1));return this.tagName.toLowerCase()===s;}
  closest(s){const selectors=s.split(',').map(x=>x.trim());return selectors.some(x=>this.matches(x))?this:this.parentElement?.closest(s)||null;}
  querySelectorAll(s){return this.children.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  focus(){} scrollIntoView(){} showModal(){this.open=true;} close(){this.open=false;}
  getBoundingClientRect(){return {left:10,top:10,right:110,bottom:60,width:100,height:50};}
  getClientRects(){return [this.getBoundingClientRect()];}
 }
 const body=new Node('body'),side=new Node('aside'),mod=new Node('section'),editable=new Node('h2');side.className='pg-side';mod.dataset.mod='color';editable.dataset.edit='color#1';editable.append(new Node('#text','旧文字'));mod.append(editable);body.append(side,mod);
 const document={body,createElement:t=>new Node(t),createTextNode:t=>new Node('#text',t),querySelector:s=>body.querySelector(s),querySelectorAll:s=>body.querySelectorAll(s),addEventListener:(k,f)=>listeners.set(k,f),createRange:()=>({selectNodeContents(){},getBoundingClientRect:()=>mod.getBoundingClientRect()})};
 const calls=[];const context={document,location,fetch:async(url,opts={})=>{calls.push({url,opts});return respond(url,opts);},console,URL,Map,Set,Node:{TEXT_NODE:3,ELEMENT_NODE:1},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:f=>{f();return 1;},cancelAnimationFrame(){},innerWidth:1440,innerHeight:900,addEventListener:(k,f)=>listeners.set(k,f),confirm:()=>true};context.window=context;
 vm.runInNewContext(script(),context);
 return {body,side,mod,editable,nodes,calls,listeners,Node,button:text=>nodes.find(n=>!n.removed&&n.tagName==='BUTTON'&&n.textContent===text)};
}
const manifest={version:1,modules:[{id:'color',title:'色彩',edits:[{key:'color#1',source:'旧文字'}]}]};
const defaultResponse=(url)=>url.endsWith('modules.json')?Response.json(manifest):url.endsWith('/me')?Response.json({who:'yingrui'}):Response.json({comments:[]});
test('test_editor_inert_outside_design',()=>{for(const location of [{pathname:'/design/',protocol:'file:'},{pathname:'/other/',protocol:'https:'}]){const p=page(()=>{throw Error('unexpected fetch');},location);assert.equal(p.side.children.length,0);}});
test('test_editor_browse_only_entry_then_identity',async()=>{const p=page(defaultResponse);assert.equal(p.side.children.length,1);assert.equal(p.calls.length,0);await p.button('编辑').fire('click');assert.ok(p.body.classList.contains('jjb-editing'));assert.ok(p.body.textContent.includes('莹睿'));assert.equal(p.editable.attrs.contenteditable,'true');});
test('test_editor_comment_html_is_plain_text',async()=>{const body='<img src=x onerror=alert(1)>';const p=page(url=>url.includes('/comments')?Response.json({comments:[{id:1,mod:'color',author:'yingrui',body,status:'open',created_at:1000}]}):defaultResponse(url));await p.button('编辑').fire('click');await p.listeners.get('click')({target:p.mod});assert.ok(p.body.textContent.includes(body));assert.equal(p.nodes.filter(n=>n.tagName==='IMG').length,0);});
test('test_editor_401_leaves_edit_mode_and_prompts',async()=>{let expired=false;const p=page(url=>expired?Response.json({error:'unauthorized'},{status:401}):defaultResponse(url));await p.button('编辑').fire('click');expired=true;await p.listeners.get('click')({target:p.mod});const area=p.nodes.find(n=>n.tagName==='TEXTAREA');area.value='test-comment';await p.button('新增评论').fire('click');assert.equal(p.body.classList.contains('jjb-editing'),false);assert.ok(p.nodes.some(n=>n.tagName==='DIALOG'&&n.open));});
test('test_editor_save_updates_source_and_keeps_conflict_dirty',async()=>{
 let saves=0;const p=page((url,opts)=>{
  if(url.endsWith('/edits')) {saves++;const payload=JSON.parse(opts.body);assert.equal(payload.edits[0].source,saves===1?'旧文字':'新文字');return Response.json(saves===1?{commit_url:'https://github.com/YishanCoding/jujubit-design-system/commit/test-fake',results:[{key:'color#1',ok:true,new_source:'新文字'}]}:{commit_url:null,results:[{key:'color#1',ok:false,error:'not_found'}]});}
  return defaultResponse(url);
 });
 await p.button('编辑').fire('click');p.editable.replaceChildren(new p.Node('#text','新文字'));await p.listeners.get('input')({target:p.editable});await p.button('保存（1 处修改）').fire('click');assert.equal(p.editable.classList.contains('is-dirty'),false);
 p.editable.replaceChildren(new p.Node('#text','再改'));await p.listeners.get('input')({target:p.editable});await p.button('保存（1 处修改）').fire('click');assert.ok(p.editable.classList.contains('is-dirty'));assert.ok(p.body.textContent.includes('这段已被改动，刷新后再改'));
 let prevented=false;p.listeners.get('beforeunload')({preventDefault(){prevented=true;}});assert.ok(prevented);
});
test('test_editor_css_uses_existing_tokens',()=>{
 const css=readFileSync(new URL('../../editor/editor.css',import.meta.url),'utf8');
 const tokens=readFileSync(new URL('../../tokens.css',import.meta.url),'utf8');
 const defined=new Set([...tokens.matchAll(/(--jjb-[\w-]+)\s*:/g)].map(m=>m[1]));
 for(const [,token] of css.matchAll(/var\((--jjb-[\w-]+)/g))assert.ok(defined.has(token),token);
});
