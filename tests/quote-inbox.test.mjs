import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerInboxApi} from '../worker/quote-inbox.ts';

const id='hn-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const other='hn-bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const endpoint='https://quotes.example/api/quote-inbox';
function mock(){
 const rows=[
  {cursor:1,id:'11111111-1111-4111-8111-111111111111',quote_id:id,page_id:7,sender:'client',kind:'text',text:'Can you adjust the price?',created_at:1720000000},
  {cursor:2,id:'22222222-2222-4222-8222-222222222222',quote_id:id,page_id:7,sender:'client',kind:'audio',text:'',created_at:1720000000},
  {cursor:3,id:'33333333-3333-4333-8333-333333333333',quote_id:id,page_id:7,sender:'owner',kind:'text',text:'Yes!',created_at:1720000000}
 ];
 let cursor=0;
 const DB={prepare(sql){
  let args=[];
  return{
   bind(...values){args=values;return this;},
   async all(){
    if(sql.includes('JOIN (SELECT quote_id,MAX(rowid)')){
     const latest=rows.at(-1);
     return {results:[{...latest,title:'Isabella Daniel',couple:'Isabella & Daniel',
      unread:rows.filter(r=>r.sender==='client'&&r.cursor>cursor).length}]};
    }
    return {results:rows.filter(r=>r.quote_id===args[0]).map(r=>({...r}))};
   },
   async first(){
    if(sql.includes('SELECT id FROM quotes'))return args[0]===id?{id}:null;
    if(sql.includes('MAX(rowid)'))return {maxCursor:rows.at(-1).cursor};
    return null;
   },
   async run(){if(sql.includes('INSERT INTO quote_chat_reads'))cursor=Math.max(cursor,args[1]);return {meta:{changes:1}};}
  };
 }};
 return {store:{DB},rows,read:()=>cursor};
}
test('Bandeja reúne respuestas de todas las páginas de una cotización',async()=>{
 const m=mock();
 const response=await ownerInboxApi(new Request(endpoint),m.store);
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.conversations.length,1);
 assert.equal(body.conversations[0].title,'Isabella Daniel');
 assert.equal(body.conversations[0].unread,2);
 assert.equal(body.unreadTotal,2);
 const thread=await ownerInboxApi(new Request(endpoint+'/'+id),m.store);
 const messages=(await thread.json()).messages;
 assert.equal(messages.length,3);
 assert.deepEqual(messages.map(x=>x.kind),['text','audio','text']);
 assert.equal(messages[1].audioUrl,'/api/quote-chat/'+id+'/7/audio/'+m.rows[1].id);
});
test('Solo al abrir la conversación se pueden marcar mensajes como vistos',async()=>{
 const m=mock(),url=endpoint+'/'+id+'/read';
 assert.equal(m.read(),0);
 const request=new Request(url,{method:'POST',body:JSON.stringify({cursor:3})});
 assert.equal((await ownerInboxApi(request,m.store)).status,200);
 assert.equal(m.read(),3);
 assert.equal((await (await ownerInboxApi(new Request(endpoint),m.store)).json()).unreadTotal,0);
 const bad=new Request(url,{method:'POST',body:JSON.stringify({cursor:999})});
 assert.equal((await ownerInboxApi(bad,m.store)).status,400);
 assert.equal(m.read(),3);
 const otherQuote=new Request(endpoint+'/'+other+'/read',{method:'POST',body:JSON.stringify({cursor:3})});
 assert.equal((await ownerInboxApi(otherQuote,m.store)).status,404);
});
test('La API está siempre protegida por la sesión del teléfono',()=>{
 const s=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 const segment=s.split('// The only unauthenticated API')[1];
 assert.ok(segment.indexOf('ownerInboxApi(request,env)')>segment.indexOf('if (!await authorized(request, env))'));
 assert.ok(segment.indexOf('publicSharing(request,env)')<segment.indexOf('if (!await authorized(request, env))'));
});
test('Bandeja prioritaria y notificaciones no son mensajes demo',()=>{
 const inbox=readFileSync(new URL('../src/features/messages/useLiveInbox.ts',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app/App.tsx',import.meta.url),'utf8');
 const screen=readFileSync(new URL('../src/features/messages/MessagesScreen.tsx',import.meta.url),'utf8');
 assert.match(inbox,/POLL_MS=2200/);
 assert.match(inbox,/showNotification/);
 assert.match(app,/unreadCount=\{inbox.unreadTotal\}/);
 assert.match(screen,/Ver cotización/);
 assert.doesNotMatch(screen,/DATOS DE EJEMPLO|Respuesta de prueba/);
});
