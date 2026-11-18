import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteChatApi} from '../worker/quote-chat.ts';
const ID='hn-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const TOKEN='a'.repeat(64);
const q={id:ID,status:'Listo para enviar',designLayout:{pageOrder:[3,4],pageKinds:{'3':'chat'}}};
const link={token:TOKEN,quote_id:ID,created_at:1,expires_at:null,revoked_at:null};
function fakeStore(){
 const rows=[],files=new Map();
 const DB={prepare(sql){
  let args=[];
  return {bind(...values){args=values;return this;},
   async first(){
    if(sql.includes('FROM quote_links WHERE token'))return args[0]===TOKEN?link:null;
    if(sql.includes('FROM quotes WHERE id'))return args[0]===ID?{payload:JSON.stringify(q),revision:1,id:ID}:null;
    if(sql.includes('COUNT(*) AS n'))return {n:rows.filter(x=>x.quote_id===args[0]&&x.page_id===args[1]&&x.sender===args[2]).length};
    if(sql.includes('FROM quote_chat_messages WHERE id=? AND quote_id=?')){
     return rows.find(x=>x.id===args[0]&&x.quote_id===args[1])||null;
    }
    if(sql.includes('SELECT mime FROM quote_chat_messages')){
      return rows.find(x=>x.id===args[0]&&x.quote_id===args[1]&&x.page_id===args[2]&&x.kind==='audio')||null;
    }
    if(sql.includes('SELECT audio_key,mime FROM quote_chat_messages')){
     return rows.find(x=>x.id===args[0]&&x.quote_id===args[1]&&x.page_id===args[2]&&x.kind==='audio')||null;
    }
    return null;
   },
   async all(){if(sql.includes('FROM quote_chat_messages'))return {results:rows.filter(x=>x.quote_id===args[0]&&x.page_id===args[1])};return {results:[]};},
   async run(){
    if(sql.includes('UPDATE quote_chat_messages SET audio_key')){
     const row=rows.find(x=>x.id===args[1]&&x.quote_id===args[2]&&x.page_id===args[3]&&x.mime==='audio/webm');
     if(row){row.audio_key=args[0];row.mime='audio/wav';return {meta:{changes:1}};}
     return {meta:{changes:0}};
    }
    if(sql.includes('INSERT INTO quote_chat_messages')){
     const audio=sql.includes('audio_key,mime');
     const [id,quote_id,page_id,sender,kind,text,audio_key,mime]=args;
     rows.push({id,quote_id,page_id,sender,kind,text,audio_key:audio?audio_key:null,mime:audio?mime:null,created_at:1700000000});
    }
    return {meta:{changes:1}};
   }
  };
 }};
 const MEDIA={
  async get(key){return files.has(key)?{size:files.get(key).byteLength,body:new Blob([files.get(key)]).stream()}:null;},
  async put(key,buffer){files.set(key,buffer);},
  async delete(key){files.delete(key);}
 };
 return {store:{DB,MEDIA},rows,files};
}
const own='/api/quote-chat/'+ID+'/3';
const shared='/api/shared/'+TOKEN+'/chat/3';
const req=(path,method='GET',body,contentType='application/json')=>
 new Request('https://example.com'+path,{method,...(body===undefined?{}:{
 headers:{'Content-Type':contentType},
 body:typeof body==='string'?body:body instanceof Uint8Array?body:JSON.stringify(body)})});
test('Solo acepta chats de páginas marcadas, aunque exista otra página',async()=>{
 const m=fakeStore();
 assert.equal((await quoteChatApi(req(own),m.store,false)).status,200);
 assert.equal((await quoteChatApi(req('/api/quote-chat/'+ID+'/4'),m.store,false)).status,404);
 assert.equal((await quoteChatApi(req('/api/shared/'+'f'.repeat(64)+'/chat/3'),m.store,true)).status,404);
 q.designLayout.pageKinds['3']='blank';
 assert.equal((await quoteChatApi(req(shared),m.store,true)).status,404);
 q.designLayout.pageKinds['3']='chat';
});
test('Mensajes de texto cruzan entre dueño y cliente, sin adjuntar medios',async()=>{
 const m=fakeStore();
 const a=await quoteChatApi(req(own,'POST',{text:'We can offer the quintet!'}),m.store,false);
 assert.equal(a.status,201);
 const b=await quoteChatApi(req(shared,'POST',{text:'Can we adjust the offer?'}),m.store,true);
 assert.equal(b.status,201);
 const list=await (await quoteChatApi(req(shared),m.store,true)).json();
 assert.deepEqual(list.messages.map(x=>x.sender),['owner','client']);
 assert.deepEqual(list.messages.map(x=>x.text),['We can offer the quintet!','Can we adjust the offer?']);
 assert.equal(list.messages[0].audioUrl,null);
 assert.equal((await quoteChatApi(req(shared,'POST',{text:'  '}),m.store,true)).status,400);
 assert.equal((await quoteChatApi(req(shared,'POST',{text:'x'.repeat(1800)}),m.store,true)).status,400);
});
test('Audio solo con MIME permitido y firma real, aislado por token y página',async()=>{
 const m=fakeStore();
 const invalid=await quoteChatApi(req(shared,'POST',new Uint8Array([0,1,2]),'image/png'),m.store,true);
 assert.equal(invalid.status,415);
 const webm=new Uint8Array([0x1a,0x45,0xdf,0xa3,0x9f,0,1,2,3,4,5]);
 const saved=await quoteChatApi(req(shared,'POST',webm,'audio/webm'),m.store,true);
 assert.equal(saved.status,201);
 const message=(await saved.json()).message;
 assert.equal(message.kind,'audio');
 const play=await quoteChatApi(req(message.audioUrl),m.store,true);
 assert.equal(play.status,200);
 assert.equal(play.headers.get('Content-Type'),'audio/webm');
 const rejected=await quoteChatApi(req('/api/shared/'+'f'.repeat(64)+'/chat/3/audio/'+message.id),m.store,true);
 assert.equal(rejected.status,404);
 link.revoked_at=1700000000;
 assert.equal((await quoteChatApi(req(message.audioUrl),m.store,true)).status,404);
 link.revoked_at=null;
});
test('El servidor impide que la ruta cliente lea conversaciones por una ruta del dueño',async()=>{
 const m=fakeStore();
 assert.equal(await quoteChatApi(req('/api/media/'+ID),m.store,true),undefined);
 assert.equal(await quoteChatApi(req('/api/quote-chat/'+ID+'/3'),m.store,true),undefined);
 assert.equal((await quoteChatApi(req('/api/shared/'+TOKEN+'/chat/3','DELETE'),m.store,true)).status,405);
});

test('iPhone Safari receives byte ranges and owner can repair old WebM voice to WAV',async()=>{
 const m=fakeStore(),webm=new Uint8Array([0x1a,0x45,0xdf,0xa3,0x9f,0,1,2,3,4,5]);
 const saved=await quoteChatApi(req(shared,'POST',webm,'audio/webm'),m.store,true);
 const voice=(await saved.json()).message;
 const partial=new Request('https://example.com'+voice.audioUrl,{headers:{Range:'bytes=0-3'}});
 const segmented=await quoteChatApi(partial,m.store,true);
 assert.equal(segmented.status,206);
 assert.equal(segmented.headers.get('Accept-Ranges'),'bytes');
 assert.equal(segmented.headers.get('Content-Range'),'bytes 0-3/11');
 const wav=new Uint8Array(48);
 for(let i=0;i<4;i++)wav[i]='RIFF'.charCodeAt(i);
 for(let i=0;i<4;i++)wav[8+i]='WAVE'.charCodeAt(i);
 const compatible=await quoteChatApi(req(own+'/audio/'+voice.id+'/compatible','PUT',wav,'audio/wav'),m.store,false);
 assert.equal(compatible.status,200);
 const player=await quoteChatApi(req(voice.audioUrl),m.store,true);
 assert.equal(player.headers.get('Content-Type'),'audio/wav');
 const repeated=await quoteChatApi(req(own+'/audio/'+voice.id+'/compatible','PUT',wav,'audio/wav'),m.store,false);
 assert.equal(repeated.status,409);
});
