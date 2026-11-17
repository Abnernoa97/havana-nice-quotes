import type {VideoStore} from './videos.ts';
import {readShare} from './quote-sharing.ts';

type Store=VideoStore;
type Row=Record<string,unknown>;
type MessageRow=Row & {
 id:string;quote_id:string;page_id:number;sender:'owner'|'client';
 kind:'text'|'audio';text:string;audio_key:string|null;mime:string|null;created_at:number;
};
const quoteRE=/^hn-[a-f0-9-]{20,64}$/;
const LIMIT=6*1024*1024;
const MIME=new Set(['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav']);
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}
});
const fail=(msg:string,status=400)=>reply({error:msg},status);
function mimeType(request:Request){
 return request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()||'';
}
function isRealAudio(bytes:Uint8Array,mime:string){
 const head=Array.from(bytes.slice(0,12));
 const ascii=String.fromCharCode(...head);
 return mime==='audio/webm' && head[0]===0x1a&&head[1]===0x45&&head[2]===0xdf&&head[3]===0xa3 ||
   mime==='audio/mp4' && ascii.slice(4,8)==='ftyp' ||
   mime==='audio/ogg' && ascii.startsWith('OggS') ||
   mime==='audio/wav' && ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WAVE' ||
   mime==='audio/mpeg' && (ascii.startsWith('ID3')||head[0]===0xff&&(head[1]&0xe0)===0xe0);
}
function findRoute(path:string,publicMode:boolean){
 const re=publicMode
  ? /^\/api\/shared\/([a-f0-9]{64})\/chat\/(\d{1,4})(?:\/audio\/([a-f0-9-]{36}))?$/
  : /^\/api\/quote-chat\/(hn-[a-f0-9-]{20,64})\/(\d{1,4})(?:\/audio\/([a-f0-9-]{36}))?$/;
 return re.exec(path);
}
function hasChatPage(q:Row,page:number):boolean{
 const l=q.designLayout as {pageOrder?:number[];pageKinds?:Record<string,string>}|undefined;
 return Number.isInteger(page)&&page>=3&&page<=1024&&
   Array.isArray(l?.pageOrder)&&l.pageOrder.includes(page)&&l.pageKinds?.[String(page)]==='chat';
}
async function loadOwnerQuote(store:Store,id:string){
 if(!quoteRE.test(id))return null;
 const row=await store.DB.prepare(
  'SELECT payload FROM quotes WHERE id=? AND deleted_at IS NULL'
 ).bind(id).first<Row>();
 if(!row)return null;
 try{const quote=JSON.parse(String(row.payload)) as Row;
  return quote.isTemplate?null:quote;}catch{return null;}
}
function asMessage(row:MessageRow,route:string){
 return {id:row.id,sender:row.sender,kind:row.kind,
  text:row.kind==='text'?row.text:'',createdAt:row.created_at,
  audioUrl:row.kind==='audio'?route+'/audio/'+row.id:null};
}
/** Every request is tied to a single saved quote, a chat-typed page, and
 * either the authorized owner device or a currently active share token. */
export async function quoteChatApi(request:Request,store:Store,publicMode:boolean):Promise<Response|undefined>{
 const url=new URL(request.url),match=findRoute(url.pathname,publicMode);
 if(!match)return undefined;
 const [_,identity,pageText,messageId]=match,method=request.method.toUpperCase();
 const page=Number(pageText);
 const shared=publicMode?await readShare(store,identity):null;
 const quote=publicMode?shared?.q:await loadOwnerQuote(store,identity);
 if(!quote||!hasChatPage(quote,page))return fail('Chat unavailable.',404);
 const quoteId=publicMode?String(shared!.q.id):identity;
 const route='/api/'+(publicMode?'shared/'+identity+'/chat/':'quote-chat/'+identity+'/')+page;
 if(messageId){
  if(method!=='GET'&&method!=='HEAD')return fail('Method not allowed.',405);
  const row=await store.DB.prepare(
   'SELECT audio_key,mime FROM quote_chat_messages WHERE id=? AND quote_id=? AND page_id=? AND kind=?'
  ).bind(messageId,quoteId,page,'audio').first<Row>();
  const key=row?.audio_key;
  if(typeof key!=='string'||!key.startsWith('quotes-studio/quote-chat/'+quoteId+'/'))return fail('Audio unavailable.',404);
  const media=await store.MEDIA.get(key);
  if(!media)return fail('Audio unavailable.',404);
  return new Response(method==='HEAD'?null:media.body,{status:200,headers:{
   'Content-Type':String(row?.mime||'audio/webm'),'Content-Length':String(media.size),
   'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type':'nosniff'
  }});
 }
 if(method==='GET'){
  const all=await store.DB.prepare(
   'SELECT id,quote_id,page_id,sender,kind,text,audio_key,mime,created_at FROM quote_chat_messages WHERE quote_id=? AND page_id=? ORDER BY created_at ASC,id ASC LIMIT 150'
  ).bind(quoteId,page).all<MessageRow>();
  return reply({messages:all.results.map(row=>asMessage(row,route))});
 }
 if(method!=='POST')return fail('Method not allowed.',405);
 // Bound anonymous posts, so a forwarded client link cannot fill R2 or D1.
 const count=await store.DB.prepare(
  'SELECT COUNT(*) AS n FROM quote_chat_messages WHERE quote_id=? AND page_id=? AND sender=? AND created_at > unixepoch()-60'
 ).bind(quoteId,page,publicMode?'client':'owner').first<Row>();
 if(Number(count?.n||0)>=15)return fail('Too many messages. Please try again shortly.',429);
 const kind=mimeType(request)==='application/json'?'text':'audio';
 const id=crypto.randomUUID(),sender=publicMode?'client':'owner';
 if(kind==='text'){
  const body=await request.text();
  if(body.length>4500)return fail('Message too long.',413);
  let text:string;
  try{const data=JSON.parse(body) as {text?:unknown};text=typeof data.text==='string'?data.text.trim():'';}
  catch{return fail('Invalid message.');}
  if(!text||text.length>1600)return fail('Write a message (up to 1,600 characters).');
  await store.DB.prepare(
   'INSERT INTO quote_chat_messages (id,quote_id,page_id,sender,kind,text) VALUES (?,?,?,?,?,?)'
  ).bind(id,quoteId,page,sender,'text',text).run();
 }else{
  const mime=mimeType(request);
  if(!MIME.has(mime))return fail('Only voice messages are supported.',415);
  const size=Number(request.headers.get('Content-Length')||0);
  if(size>LIMIT)return fail('Voice message is too large.',413);
  const data=await request.arrayBuffer();
  if(!data.byteLength||data.byteLength>LIMIT||!isRealAudio(new Uint8Array(data.slice(0,16)),mime))
   return fail('Invalid audio recording.',415);
  const key='quotes-studio/quote-chat/'+quoteId+'/'+id;
  await store.MEDIA.put(key,data,{httpMetadata:{contentType:mime},
   customMetadata:{module:'havana-nice-quotes',kind:'chat-voice',quoteId}});
  try{
   await store.DB.prepare(
    'INSERT INTO quote_chat_messages (id,quote_id,page_id,sender,kind,text,audio_key,mime) VALUES (?,?,?,?,?,?,?,?)'
   ).bind(id,quoteId,page,sender,'audio','',key,mime).run();
  }catch(error){await store.MEDIA.delete(key);throw error;}
 }
 const row=await store.DB.prepare(
  'SELECT id,quote_id,page_id,sender,kind,text,audio_key,mime,created_at FROM quote_chat_messages WHERE id=? AND quote_id=?'
 ).bind(id,quoteId).first<MessageRow>();
 return reply({message:row?asMessage(row,route):null},201);
}
