import { useCallback,useEffect,useRef,useState } from 'react';
import { compressVideoForWeb } from './compress-video';
import type { WebVideo } from './compress-video';
import {saveVideoPoster} from './video-posters';

export type CloudVideo={id:string;name:string;mime:string;size:number;createdAt:number;url:string;posterUrl:string};
export type VideoProgress={phase:'converting'|'uploading';percent:number;originalBytes:number;convertedBytes?:number};
type Start={id:string;uploadId:string;partSize:number};
type Uploaded={partNumber:number;etag:string};
const MB=1024*1024;
async function videoFetch<T>(path:string,method:string,body?:BodyInit,
 headers?:HeadersInit,signal?:AbortSignal):Promise<T>{
 const response=await fetch(path,{method,body,headers,credentials:'same-origin',signal});
 const data=await response.json().catch(()=>({})) as T&{error?:string};
 if(!response.ok)throw new Error(data.error||'No se pudo transferir el video.');
 return data;
}
/** Independent hook: no video ever enters the photo gallery or quote schema. */
export function useVideoLibrary(enabled:boolean){
 const [videos,setVideos]=useState<CloudVideo[]>([]);
 const [bytesUsed,setBytesUsed]=useState(0);
 const [error,setError]=useState('');
 const [progress,setProgress]=useState<VideoProgress|null>(null);
 const [lastSaved,setLastSaved]=useState<{originalBytes:number;convertedBytes:number}|null>(null);
 const lock=useRef(false);
 const controller=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  if(!enabled)return;
  try{
   const result=await videoFetch<{videos:CloudVideo[];bytesUsed:number}>('/api/videos','GET');
   setVideos(result.videos);setBytesUsed(result.bytesUsed);setError('');
  }catch{setError('No se pudo actualizar la biblioteca de videos.');}
 },[enabled]);
 useEffect(()=>{
  if(!enabled){setVideos([]);setBytesUsed(0);return;}
  void refresh();
 },[enabled,refresh]);
 const cancel=useCallback(()=>controller.current?.abort(),[]);
 const upload=useCallback(async(source:File):Promise<WebVideo>=>{
  if(!enabled)throw new Error('El teléfono no está vinculado.');
  if(lock.current)throw new Error('Ya se está convirtiendo otro video.');
  lock.current=true;
  const abort=new AbortController();controller.current=abort;
  setError('');setLastSaved(null);
  setProgress({phase:'converting',percent:0,originalBytes:source.size});
  let session:Start|undefined;
  let completed=false;
  try{
   const converted=await compressVideoForWeb(source,percent=>
     setProgress({phase:'converting',percent,originalBytes:source.size}),abort.signal);
   if(converted.file.size>512*MB)throw new Error('La versión web supera 512 MB; usa un video más corto.');
   setProgress({phase:'uploading',percent:0,originalBytes:source.size,convertedBytes:converted.file.size});
   session=await videoFetch<Start>('/api/videos/init','POST',JSON.stringify({
    name:converted.file.name,mime:converted.file.type,size:converted.file.size,
   }),{'Content-Type':'application/json'},abort.signal);
   const numberOfParts=Math.ceil(converted.file.size/session.partSize);
   const parts:Uploaded[]=[];
   for(let i=0;i<numberOfParts;i++){
    const slice=converted.file.slice(i*session.partSize,(i+1)*session.partSize);
    const path='/api/videos/'+session.id+'/part?uploadId='+encodeURIComponent(session.uploadId)+'&part='+(i+1);
    let chunk:Uploaded|undefined;
    for(let attempt=0;attempt<3;attempt++){
     if(abort.signal.aborted)throw new Error('Carga cancelada.');
     try{chunk=await videoFetch<Uploaded>(path,'PUT',slice,
       {'Content-Type':'application/octet-stream'},abort.signal);break;
     }catch(cause){if(attempt===2||abort.signal.aborted)throw cause;}
    }
    if(!chunk)throw new Error('No se pudo guardar la parte del video.');
    parts.push(chunk);
    setProgress({phase:'uploading',percent:Math.round((i+1)/numberOfParts*100),
      originalBytes:source.size,convertedBytes:converted.file.size});
   }
   await videoFetch('/api/videos/'+session.id+'/complete','POST',
    JSON.stringify({uploadId:session.uploadId,parts,name:converted.file.name,
      mime:converted.file.type,size:converted.file.size}),{'Content-Type':'application/json'},abort.signal);
   completed=true;
   // Poster is a small R2 JPEG, not a video decode on every gallery visit.
   // A failed poster upload never discards a successfully saved video.
   if(converted.poster)await saveVideoPoster(session.id,converted.poster).catch(()=>{});
   setLastSaved({originalBytes:source.size,convertedBytes:converted.file.size});
   await refresh();
   return converted;
  }catch(cause){
   setError(cause instanceof Error?cause.message:'No se pudo guardar el video.');
   throw cause;
  }finally{
   if(session&&!completed){
    // Only failures abort the unfinished upload; completed objects stay in the library.
    await videoFetch('/api/videos/'+session.id+'/abort','POST',
      JSON.stringify({uploadId:session.uploadId}),{'Content-Type':'application/json'}).catch(()=>{});
   }
   lock.current=false;controller.current=null;setProgress(null);
  }
 },[enabled,refresh]);
 const remove=useCallback(async(id:string)=>{
  if(lock.current)return;
  await videoFetch('/api/videos/'+id,'DELETE');
  await refresh();
 },[refresh]);
 return {videos,bytesUsed,error,progress,lastSaved,upload,cancel,remove,refresh};
}
