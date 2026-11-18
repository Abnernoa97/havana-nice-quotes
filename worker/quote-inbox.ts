import type {VideoStore} from './videos.ts';

/** Owner-only inbox: it is routed strictly after device-session authorization. */
type Store=VideoStore;
type Row=Record<string,unknown>;
type InboxRow=Row & {
 quote_id:string;page_id:number;kind:'text'|'audio';sender:'owner'|'client';
 text:string;created_at:number;cursor:number;title:string;couple:string;unread:number;
};
type MessageRow=Row & {
 id:string;quote_id:string;page_id:number;kind:'text'|'audio';
 sender:'owner'|'client';text:string;created_at:number;cursor:number;
};
const idRE=/^hn-[a-f0-9-]{20,64}$/;
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'}});
const error=(msg:string,status=400)=>json({error:msg},status);
async function exists(db:Store['DB'],id:string):Promise<boolean>{
 if(!idRE.test(id))return false;
 const row=await db.prepare(
  "SELECT id FROM quotes WHERE id=? AND deleted_at IS NULL AND COALESCE(json_extract(payload,'$.isTemplate'),0) != 1"
 ).bind(id).first<Row>();
 return Boolean(row);
}
export async function ownerInboxApi(request:Request,store:Store):Promise<Response|undefined>{
 const url=new URL(request.url),path=url.pathname,method=request.method.toUpperCase();
 if(path==='/api/quote-inbox'&&method==='GET'){
  // Return only existing quotes with actual conversations. Latest by rowid avoids
  // same-second ambiguities and lets concurrent client messages appear correctly.
  const rows=await store.DB.prepare(
   `SELECT m.quote_id,m.page_id,m.kind,m.sender,m.text,m.created_at,m.rowid AS cursor,
    COALESCE(NULLIF(json_extract(q.payload,'$.quoteTitle'),''),NULLIF(json_extract(q.payload,'$.name'),''),'Cotización') AS title,
    COALESCE(json_extract(q.payload,'$.name'),'') AS couple,
    (SELECT COUNT(*) FROM quote_chat_messages incoming
     WHERE incoming.quote_id=m.quote_id AND incoming.sender='client'
      AND incoming.rowid>COALESCE(r.last_seen_rowid,0)) AS unread
    FROM quote_chat_messages m
    JOIN (SELECT quote_id,MAX(rowid) AS latest FROM quote_chat_messages GROUP BY quote_id) newest
      ON newest.quote_id=m.quote_id AND newest.latest=m.rowid
    JOIN quotes q ON q.id=m.quote_id AND q.deleted_at IS NULL
    LEFT JOIN quote_chat_reads r ON r.quote_id=m.quote_id
    WHERE COALESCE(json_extract(q.payload,'$.isTemplate'),0) != 1
    ORDER BY m.rowid DESC LIMIT 100`
  ).all<InboxRow>();
  const conversations=rows.results.map(x=>({
   quoteId:x.quote_id,title:x.title,couple:x.couple,
   pageId:x.page_id,kind:x.kind,sender:x.sender,text:x.kind==='text'?x.text:'',
   createdAt:x.created_at,cursor:x.cursor,unread:x.unread
  }));
  return json({conversations,unreadTotal:conversations.reduce((n,x)=>n+x.unread,0)});
 }
 const match=/^\/api\/quote-inbox\/(hn-[a-f0-9-]{20,64})(?:\/(read))?$/.exec(path);
 if(!match)return undefined;
 const quoteId=match[1];
 if(!await exists(store.DB,quoteId))return error('Cotización no encontrada.',404);
 if(!match[2]&&method==='GET'){
  const rows=await store.DB.prepare(
   'SELECT rowid AS cursor,id,quote_id,page_id,kind,sender,text,created_at FROM quote_chat_messages WHERE quote_id=? ORDER BY rowid ASC LIMIT 400'
  ).bind(quoteId).all<MessageRow>();
  const messages=rows.results.map(m=>({
   cursor:m.cursor,id:m.id,pageId:m.page_id,kind:m.kind,sender:m.sender,
   text:m.kind==='text'?m.text:'',createdAt:m.created_at,
   audioUrl:m.kind==='audio'
    ?'/api/quote-chat/'+quoteId+'/'+m.page_id+'/audio/'+m.id:null
  }));
  return json({messages});
 }
 if(match[2]==='read'&&method==='POST'){
  let body:unknown;
  try{const raw=await request.text();body=raw.length<=120?JSON.parse(raw):null;}
  catch{return error('Invalid cursor.');}
  const cursor=(body as {cursor?:unknown}|null)?.cursor;
  if(typeof cursor!=='number'||!Number.isSafeInteger(cursor)||cursor<0)return error('Invalid cursor.');
  const latest=await store.DB.prepare(
   'SELECT COALESCE(MAX(rowid),0) AS maxCursor FROM quote_chat_messages WHERE quote_id=?'
  ).bind(quoteId).first<Row>();
  if(cursor>Number(latest?.maxCursor||0))return error('Cursor exceeds conversation.',400);
  await store.DB.prepare(
   `INSERT INTO quote_chat_reads (quote_id,last_seen_rowid,updated_at) VALUES (?,?,unixepoch())
    ON CONFLICT(quote_id) DO UPDATE SET
      last_seen_rowid=MAX(quote_chat_reads.last_seen_rowid,excluded.last_seen_rowid),
      updated_at=unixepoch()`
  ).bind(quoteId,cursor).run();
  return json({read:true});
 }
 return error('Method not allowed.',405);
}
