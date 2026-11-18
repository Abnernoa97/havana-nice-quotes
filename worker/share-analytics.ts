import {readShare} from './quote-sharing.ts';
import type {VideoStore} from './videos.ts';
type Store=VideoStore;
type Row=Record<string,unknown>;
const uuid=/^[a-f0-9-]{36}$/;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
const fail=(message:string,status=400)=>json({error:message},status);
const parse=async(req:Request):Promise<Record<string,unknown>|null>=>{
 const body=await req.text();
 if(body.length>300)return null;
 try{const value:unknown=JSON.parse(body);return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
 catch{return null;}
};
/** Owner metrics are only available after the existing device authorization. */
export async function ownerShareAnalytics(request:Request,store:Store):Promise<Response|undefined>{
 const path=new URL(request.url).pathname,method=request.method.toUpperCase();
 if(path==='/api/share-analytics'&&method==='GET'){
  const [sent,opened]=await Promise.all([
   store.DB.prepare('SELECT quote_id,COUNT(*) AS n FROM quote_share_events GROUP BY quote_id').all<Row>(),
   store.DB.prepare(
    'SELECT quote_id,COUNT(*) AS opens,COUNT(DISTINCT visitor_hash) AS devices FROM quote_share_visits GROUP BY quote_id'
   ).all<Row>()
  ]);
  const summary:Record<string,{shares:number;opens:number;devices:number}>={};
  for(const x of sent.results)summary[String(x.quote_id)]={shares:Number(x.n)||0,opens:0,devices:0};
  for(const x of opened.results){
   const id=String(x.quote_id);
   summary[id]={shares:summary[id]?.shares||0,opens:Number(x.opens)||0,devices:Number(x.devices)||0};
  }
  return json({quotes:summary});
 }
 const match=/^\/api\/share-analytics\/([a-f0-9]{64})\/handoff$/.exec(path);
 if(!match)return undefined;
 if(method!=='POST')return fail('Method not allowed.',405);
 const share=await readShare(store,match[1]);
 if(!share)return fail('Quotation link unavailable.',404);
 const body=await parse(request),channel=body?.channel,requestId=body?.requestId;
 if(!['whatsapp','copy','manual'].includes(String(channel)))return fail('Invalid channel.');
 if(typeof requestId!=='string'||!uuid.test(requestId))return fail('Invalid request ID.');
 const quoteId=String(share.q.id);
 if(channel!=='manual'){
  await store.DB.prepare(
   'INSERT OR IGNORE INTO quote_share_events (id,quote_id,token,channel) VALUES (?,?,?,?)'
  ).bind(requestId,quoteId,match[1],String(channel)).run();
 }
 await store.DB.prepare(
  `UPDATE quotes SET payload=json_set(payload,'$.status','Enviada'),
    revision=revision+1,updated_at=unixepoch()
    WHERE id=? AND deleted_at IS NULL AND json_extract(payload,'$.status')='Listo para enviar'`
 ).bind(quoteId).run();
 return json({recorded:true,status:'Enviada',channel});
}
/** Anonymous public view event: counted only after a valid quotation has rendered.
 * The random visitor identifier is hashed and never returned to the owner. */
export async function publicShareVisit(request:Request,store:Store):Promise<Response|undefined>{
 const path=new URL(request.url).pathname,method=request.method.toUpperCase();
 const match=/^\/api\/shared\/([a-f0-9]{64})\/visit$/.exec(path);
 if(!match)return undefined;
 if(method!=='POST')return fail('Method not allowed.',405);
 const share=await readShare(store,match[1]);
 if(!share)return fail('Quotation link unavailable.',404);
 const body=await parse(request);
 const visitor=body?.visitorId,visitId=body?.visitId;
 if(typeof visitor!=='string'||!uuid.test(visitor)||typeof visitId!=='string'||!uuid.test(visitId))
  return fail('Invalid anonymous visit ID.');
 const bytes=new TextEncoder().encode(visitor);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const visitorHash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
 // A real customer opening is proof the proposal was delivered,
 // including links shared before analytics was implemented.
 await store.DB.prepare(
  `UPDATE quotes SET payload=json_set(payload,'$.status','Enviada'),
   revision=revision+1,updated_at=unixepoch()
   WHERE id=? AND deleted_at IS NULL AND json_extract(payload,'$.status')='Listo para enviar'`
 ).bind(String(share.q.id)).run();
 const result=await store.DB.prepare(
  'INSERT OR IGNORE INTO quote_share_visits (id,quote_id,token,visitor_hash,visit_id) VALUES (?,?,?,?,?)'
 ).bind(crypto.randomUUID(),String(share.q.id),match[1],visitorHash,visitId).run();
 return json({counted:Boolean(result.meta.changes)});
}
