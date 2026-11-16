/**
 * HAVANA QUOTES video library. Only compressed web-ready videos reach this API.
 * The main Worker checks the device cookie and same-origin policy first.
 * Uses the existing D1 media table and the existing private R2 bucket.
 */
const PREFIX='quotes-studio/videos/';
export const VIDEO_PART_SIZE=6*1024*1024; // R2 multipart: >=5 MiB except last
export const MAX_WEB_VIDEO_BYTES=512*1024*1024;
type VideoMime='video/mp4'|'video/webm';
const allowed=(value:unknown):value is VideoMime=>value==='video/mp4'||value==='video/webm';
const validId=(id:string)=>/^[a-f0-9-]{36}$/.test(id);
const validUploadId=(id:string)=>id.length>=8&&id.length<=512&&!/[\s\x00-\x1f]/.test(id);
interface DbStatement{
 bind(...args:(string|number)[]):DbStatement;
 first<T extends Record<string,unknown>>():Promise<T|null>;
 all<T extends Record<string,unknown>>():Promise<{results:T[]}>;
 run():Promise<{meta:{changes:number}}>;
}
interface MultiUpload{
 uploadId:string;
 uploadPart(number:number,bytes:ArrayBuffer):Promise<{partNumber:number;etag:string}>;
 complete(parts:{partNumber:number;etag:string}[]):Promise<{size:number}>;
 abort():Promise<void>;
}
interface VideoR2{
 createMultipartUpload(key:string,options:{
  httpMetadata:{contentType:string};customMetadata:Record<string,string>;
 }):Promise<MultiUpload>;
 resumeMultipartUpload(key:string,uploadId:string):MultiUpload;
 get(key:string,opts?:{range:{offset:number;length:number}}):Promise<{
   body:ReadableStream;size:number;
 }|null>;
 delete(key:string):Promise<void>;
}
export interface VideoStore{
 DB:{prepare(sql:string):DbStatement};
 MEDIA:VideoR2;
}
interface VideoRow extends Record<string,unknown>{id:string;filename:string;mime:string;size:number;created_at:number;object_key:string;deleted_at?:number|null}
const respond=(value:unknown,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},
});
const err=(message:string,status=400)=>respond({error:message},status);
const key=(id:string)=>PREFIX+id;
function safeName(value:unknown):string{
 const name=typeof value==='string'?value:'video';
 return name.replace(/[<>\x00-\x1f]/g,'').slice(0,150)||'video';
}
const publicVideo=(row:VideoRow)=>({
 id:row.id,name:row.filename,mime:row.mime,size:row.size,
 createdAt:row.created_at,url:'/api/videos/'+row.id,
});
async function jsonBody(request:Request):Promise<Record<string,unknown>|null>{
 const text=await request.text();
 if(text.length>50000)return null;
 try{const v:unknown=JSON.parse(text);
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
 }catch{return null;}
}
function validMeta(v:Record<string,unknown>|null){
 return Boolean(v&&allowed(v.mime)&&Number.isSafeInteger(v.size)&&
  typeof v.size==='number'&&v.size>0&&v.size<=MAX_WEB_VIDEO_BYTES&&
  typeof v.name==='string'&&v.name.trim()&&v.name.length<=180);
}
function validParts(value:unknown,size:number):value is {partNumber:number;etag:string}[]{
 const expected=Math.ceil(size/VIDEO_PART_SIZE);
 return Array.isArray(value)&&value.length===expected&&expected>0&&expected<=90&&
 value.every((p,i)=>p&&typeof p==='object'&&p.partNumber===i+1&&
  typeof p.etag==='string'&&/^[a-f0-9]{32}$/i.test(p.etag));
}
/** GET accepts a single range for browser seek. Never issue a public bucket URL. */
function parseRange(value:string|null,size:number):{start:number;end:number}|null|false{
 if(!value)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(value.trim());
 if(!m||(m[1]===''&&m[2]===''))return false;
 if(m[1]===''){
  const count=Number(m[2]);
  if(!Number.isSafeInteger(count)||count<=0)return false;
  return {start:Math.max(0,size-count),end:size-1};
 }
 const start=Number(m[1]),end=m[2]===''?size-1:Number(m[2]);
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||
   end<start||start<0)return false;
 return {start,end:Math.min(end,size-1)};
}
export async function handleVideoApi(request:Request,store:VideoStore):Promise<Response>{
 const uri=new URL(request.url),path=uri.pathname,method=request.method.toUpperCase();
 if(path==='/api/videos'&&method==='GET'){
  const all=await store.DB.prepare(
   'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC'
  ).all<VideoRow>();
  const videos=all.results.filter(r=>r.object_key.startsWith(PREFIX)).map(publicVideo);
  return respond({videos,bytesUsed:videos.reduce((sum,v)=>sum+v.size,0)});
 }
 if(path==='/api/videos/init'&&method==='POST'){
  const meta=await jsonBody(request);
  if(!validMeta(meta))return err('El video convertido debe ser MP4 o WebM, de máximo 512 MB.');
  const id=crypto.randomUUID();
  const mime=meta!.mime as VideoMime;
  const upload=await store.MEDIA.createMultipartUpload(key(id),{
   httpMetadata:{contentType:mime},
   customMetadata:{module:'havana-nice-quotes',kind:'compressed-web-video'},
  });
  return respond({id,uploadId:upload.uploadId,partSize:VIDEO_PART_SIZE},201);
 }
 const match=/^\/api\/videos\/([a-f0-9-]{36})(?:\/(part|complete|abort))?$/.exec(path);
 if(!match||!validId(match[1]))return err('Ruta de video no encontrada.',404);
 const id=match[1],action=match[2];
 if(action==='part'&&method==='PUT'){
  const uploadId=uri.searchParams.get('uploadId')||'',n=Number(uri.searchParams.get('part'));
  if(!validUploadId(uploadId)||!Number.isSafeInteger(n)||n<1||n>90)
   return err('Parte de video inválida.');
  if(Number(request.headers.get('content-length'))>VIDEO_PART_SIZE)return err('Parte demasiado grande.',413);
  const bytes=await request.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>VIDEO_PART_SIZE)return err('Tamaño de parte inválido.',413);
  const part=await store.MEDIA.resumeMultipartUpload(key(id),uploadId).uploadPart(n,bytes);
  return respond({partNumber:part.partNumber,etag:part.etag});
 }
 if(action==='complete'&&method==='POST'){
  const meta=await jsonBody(request);
  const uploadId=typeof meta?.uploadId==='string'?meta.uploadId:'';
  if(!validMeta(meta)||!validUploadId(uploadId)||
    !validParts(meta?.parts,meta!.size as number))
    return err('Datos de video o partes inválidos.');
  const upload=store.MEDIA.resumeMultipartUpload(key(id),uploadId);
  const result=await upload.complete(meta!.parts as {partNumber:number;etag:string}[]);
  const size=meta!.size as number;
  if(result.size!==size){
   await store.MEDIA.delete(key(id));
   return err('La subida del video quedó incompleta. No se guardó.',409);
  }
  try{
   await store.DB.prepare('INSERT INTO media (id, object_key, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())')
    .bind(id,key(id),safeName(meta!.name),meta!.mime as string,size).run();
  }catch(cause){
   await store.MEDIA.delete(key(id));
   throw cause;
  }
  const saved=await store.DB.prepare('SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ?')
   .bind(id).first<VideoRow>();
  return respond({video:publicVideo(saved!)},201);
 }
 if(action==='abort'&&method==='POST'){
  const meta=await jsonBody(request),uploadId=typeof meta?.uploadId==='string'?meta.uploadId:'';
  if(!validUploadId(uploadId))return err('Subida inválida.');
  await store.MEDIA.resumeMultipartUpload(key(id),uploadId).abort();
  return respond({aborted:true});
 }
 if(action)return err('Método no permitido.',405);
 const row=await store.DB.prepare(
   'SELECT id, object_key, filename, mime, size, created_at FROM media WHERE id = ? AND deleted_at IS NULL'
 ).bind(id).first<VideoRow>();
 if(!row||row.object_key!==key(id))return err('Video no encontrado.',404);
 if(method==='DELETE'){
  const moved=await store.DB.prepare(
   'UPDATE media SET deleted_at = unixepoch() WHERE id = ? AND deleted_at IS NULL AND object_key = ?'
  ).bind(id,row.object_key).run();
  return moved.meta.changes?respond({trashed:true}):err('Video no encontrado.',404);
 }
 if(method!=='GET'&&method!=='HEAD')return err('Método no permitido.',405);
 const range=parseRange(request.headers.get('Range'),row.size);
 if(range===false)return new Response(null,{status:416,headers:{
  'Content-Range':'bytes */'+row.size,'Cache-Control':'private, no-store'}});
 const segment=range?await store.MEDIA.get(row.object_key,{range:{offset:range.start,length:range.end-range.start+1}})
                    :await store.MEDIA.get(row.object_key);
 if(!segment)return err('Video no encontrado en R2.',404);
 const headers=new Headers({
  'Content-Type':row.mime,'Accept-Ranges':'bytes',
  'Content-Length':String(range?range.end-range.start+1:row.size),
  'Cache-Control':'private, max-age=120',
  'X-Content-Type-Options':'nosniff',
 });
 if(range)headers.set('Content-Range','bytes '+range.start+'-'+range.end+'/'+row.size);
 return new Response(method==='HEAD'?null:segment.body,{status:range?206:200,headers});
}
export const videoPrefix=PREFIX;
