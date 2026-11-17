import {handleVideoApi} from './videos.ts';

/** A random, unguessable bearer link can read ONE saved quote and ONLY its media.
 * Owner endpoints are called after the normal device authorization in index.ts. */
interface D1Row{[key:string]:unknown}
interface DbStatement{
 bind(...v:(string|number)[]):DbStatement;
 first<T extends D1Row>():Promise<T|null>;
 run():Promise<{meta:{changes:number}}>;
}
interface ShareStore{
 DB:{prepare(sql:string):DbStatement};
 MEDIA:{
  get(key:string,opts?:{range:{offset:number;length:number}}):Promise<{
   body:ReadableStream;size:number;
  }|null>;
 };
}
type LinkRow=D1Row & {token:string;quote_id:string;created_at:number;expires_at:number|null;revoked_at:number|null};
type QuoteRow=D1Row & {id:string;payload:string;revision:number};
type MediaRow=D1Row & {object_key:string;mime:string;size:number};
const tokenRE=/^[a-f0-9]{64}$/;
const quoteRE=/^hn-[a-f0-9-]{20,64}$/;
const mediaRE=/^[a-f0-9-]{36}$/;
const now=()=>Math.floor(Date.now()/1000);
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'}
});
const error=(message:string,status=400)=>response({error:message},status);
const noAccess=()=>error('This proposal link is unavailable or has expired.',404);
function randomToken():string{
 return [...crypto.getRandomValues(new Uint8Array(32))]
   .map(n=>n.toString(16).padStart(2,'0')).join('');
}
const refFromMedia=(kind:'photo'|'video',id:string)=>'/api/'+(kind==='video'?'videos':'media')+'/'+id;
const sharedMediaUrl=(token:string,ref:unknown):string=>{
 if(typeof ref!=='string')return '';
 const match=/^\/api\/(videos|media)\/([a-f0-9-]{36})$/.exec(ref);
 if(!match)return '';
 return '/api/shared/'+token+'/media/'+(match[1]==='videos'?'video':'photo')+'/'+match[2];
};
const safeBody=async(request:Request)=>{
 const str=await request.text();
 if(str.length>1024)return null;
 try{const x:unknown=JSON.parse(str);return x&&typeof x==='object'?x as Record<string,unknown>:null;}catch{return null;}
};
async function readShare(store:ShareStore,token:string){
 if(!tokenRE.test(token))return null;
 const link=await store.DB.prepare(
  'SELECT token,quote_id,created_at,expires_at,revoked_at FROM quote_links WHERE token = ?'
 ).bind(token).first<LinkRow>();
 if(!link||link.revoked_at!==null||(link.expires_at!==null&&link.expires_at<=now()))return null;
 const row=await store.DB.prepare(
  'SELECT id,payload,revision FROM quotes WHERE id = ? AND deleted_at IS NULL'
 ).bind(link.quote_id).first<QuoteRow>();
 if(!row)return null;
 let q:Record<string,unknown>;
 try{q=JSON.parse(row.payload) as Record<string,unknown>;}catch{return null;}
 if(q.isTemplate||!['Listo para enviar','Enviada','En revisión','Aceptada'].includes(String(q.status)))return null;
 return {link,q,revision:row.revision};
}
function mediaReferences(q:Record<string,unknown>):Set<string>{
 const refs=new Set<string>();
 const add=(value:unknown)=>{
  if(typeof value==='string'&&/^\/api\/(videos|media)\/[a-f0-9-]{36}$/.test(value))refs.add(value);
 };
 add(q.cover);add(q.coverVideo);
 if(Array.isArray(q.gallery))q.gallery.forEach(add);
 const layout=q.designLayout as {extraPhotos?:{url?:unknown}[]}|undefined;
 if(Array.isArray(layout?.extraPhotos))layout.extraPhotos.forEach(x=>add(x?.url));
 return refs;
}
function forCustomer(q:Record<string,unknown>,token:string){
 // Whitelist all client-facing fields. Never expose private messages, client
 // contacts, owner notes, device sessions, raw R2 URLs, or hidden admin state.
 const layout=q.designLayout&&typeof q.designLayout==='object'
  ? q.designLayout as Record<string,unknown>:undefined;
 const extra=Array.isArray(layout?.extraPhotos)
  ? layout.extraPhotos.map(x=>{
      const photo=x as Record<string,unknown>;
      return {...photo,url:sharedMediaUrl(token,photo.url)};
    }):undefined;
 return {
  id:q.id,name:q.name,quoteTitle:q.quoteTitle,
  location:q.location,date:q.date,price:q.price,deposit:q.deposit,
  currency:q.currency,cover:sharedMediaUrl(token,q.cover),
  coverVideo:sharedMediaUrl(token,q.coverVideo),
  gallery:Array.isArray(q.gallery)?q.gallery.map(x=>sharedMediaUrl(token,x)):[],
  designLayout:layout?{...layout,...(extra?{extraPhotos:extra}:{})}:undefined,
  carolinaCopy:q.carolinaCopy,font:q.font,color:q.color,note:q.note,
  package:q.package,desc:q.desc,style:q.style,readingMode:q.readingMode,
  status:'Enviada',client:'',email:'',messages:[]
 };
}
/** Public, read-only routes: never return the owner quote list. */
export async function publicSharing(request:Request,store:ShareStore):Promise<Response|undefined>{
 const url=new URL(request.url);
 const parts=/^\/api\/shared\/([a-f0-9]{64})(?:\/media\/(photo|video)\/([a-f0-9-]{36})(\/poster)?)?$/.exec(url.pathname);
 if(!parts)return undefined;
 const method=request.method.toUpperCase();
 if(method!=='GET'&&method!=='HEAD')return error('Method not allowed.',405);
 const token=parts[1],read=await readShare(store,token);
 if(!read)return noAccess();
 if(!parts[2]){
  if(method==='HEAD')return new Response(null,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  return response({quote:forCustomer(read.q,token),revision:read.revision,
    expiresAt:read.link.expires_at});
 }
 const kind=parts[2] as 'photo'|'video',id=parts[3];
 if(!mediaRE.test(id))return noAccess();
 const realRef=refFromMedia(kind,id);
 if(!mediaReferences(read.q).has(realRef))return noAccess();
 if(kind==='video'){
  const mediaUrl=new URL(realRef+(parts[4]||''),url.origin);
  const headers=new Headers();
  if(request.headers.has('Range'))headers.set('Range',request.headers.get('Range')!);
  const proxy=await handleVideoApi(new Request(mediaUrl,{method,headers}),store);
  const outgoing=new Headers(proxy.headers);
  outgoing.set('Cache-Control','private, no-store');
  outgoing.set('Referrer-Policy','no-referrer');
  return new Response(method==='HEAD'?null:proxy.body,{status:proxy.status,headers:outgoing});
 }
 if(parts[4])return noAccess();
 const media=await store.DB.prepare(
  'SELECT object_key,mime,size FROM media WHERE id = ? AND deleted_at IS NULL'
 ).bind(id).first<MediaRow>();
 if(!media||!media.object_key.startsWith('quotes-studio/photos/'))return noAccess();
 const blob=await store.MEDIA.get(media.object_key);
 if(!blob)return noAccess();
 return new Response(method==='HEAD'?null:blob.body,{headers:{
  'Content-Type':media.mime,'Content-Length':String(blob.size),
  'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
 }});
}
/** Device-authenticated link management. Never sends a WhatsApp message. */
export async function ownerSharing(request:Request,store:ShareStore):Promise<Response|undefined>{
 const path=new URL(request.url).pathname,method=request.method.toUpperCase();
 if(path==='/api/share-links'&&method==='GET'){
  const id=new URL(request.url).searchParams.get('quoteId')||'';
  if(!quoteRE.test(id))return error('Invalid quote.',400);
  const row=await store.DB.prepare(
   'SELECT token,quote_id,created_at,expires_at,revoked_at FROM quote_links WHERE quote_id = ? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1'
  ).bind(id).first<LinkRow>();
  const link=row&&(row.expires_at===null||row.expires_at>now())?row:null;
  return response({link:link?{url:new URL('/q/'+link.token,request.url).href,
   expiresAt:link.expires_at,createdAt:link.created_at}:null});
 }
 if(path==='/api/share-links'&&method==='POST'){
  const body=await safeBody(request);
  const id=body?.quoteId,days=body?.days;
  if(typeof id!=='string'||!quoteRE.test(id)||
     ![0,1,7,30,90].includes(Number(days))||typeof days!=='number')return error('Invalid link settings.');
  const row=await store.DB.prepare(
   'SELECT payload FROM quotes WHERE id = ? AND deleted_at IS NULL'
  ).bind(id).first<D1Row>();
  if(!row)return error('Quotation not found.',404);
  const quote=JSON.parse(String(row.payload)) as Record<string,unknown>;
  if(quote.isTemplate||!['Listo para enviar','Enviada'].includes(String(quote.status)))
   return error('Save the quotation as ready to send first.',409);
  const token=randomToken(),expiry=days===0?null:now()+days*86400;
  await store.DB.prepare(
   'UPDATE quote_links SET revoked_at = unixepoch() WHERE quote_id = ? AND revoked_at IS NULL'
  ).bind(id).run();
  await store.DB.prepare(
   'INSERT INTO quote_links (token,quote_id,expires_at) VALUES (?,?,?)'
  ).bind(token,id,expiry===null?0:expiry).run();
  if(expiry===null)await store.DB.prepare(
   'UPDATE quote_links SET expires_at = NULL WHERE token = ?'
  ).bind(token).run();
  return response({link:{url:new URL('/q/'+token,request.url).href,expiresAt:expiry}},201);
 }
 const match=/^\/api\/share-links\/([a-f0-9]{64})$/.exec(path);
 if(match&&method==='DELETE'){
  await store.DB.prepare('UPDATE quote_links SET revoked_at = unixepoch() WHERE token = ? AND revoked_at IS NULL')
   .bind(match[1]).run();
  return response({revoked:true});
 }
 return undefined;
}
