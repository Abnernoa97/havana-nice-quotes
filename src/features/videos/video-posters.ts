/** Small static previews: video bytes are NEVER used as grid thumbnails. */
const POSTER_WIDTH=480,POSTER_HEIGHT=360;
const JPG_QUALITY=.78;
export function posterFromCanvas(source:HTMLCanvasElement|HTMLVideoElement):Promise<Blob|null>{
 const width=source instanceof HTMLVideoElement?source.videoWidth:source.width;
 const height=source instanceof HTMLVideoElement?source.videoHeight:source.height;
 if(!width||!height)return Promise.resolve(null);
 const canvas=document.createElement('canvas');
 canvas.width=POSTER_WIDTH;canvas.height=POSTER_HEIGHT;
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return Promise.resolve(null);
 const ratio=Math.max(POSTER_WIDTH/width,POSTER_HEIGHT/height);
 const sw=POSTER_WIDTH/ratio,sh=POSTER_HEIGHT/ratio;
 try{ctx.drawImage(source,(width-sw)/2,(height-sh)/2,sw,sh,0,0,POSTER_WIDTH,POSTER_HEIGHT);}
 catch{return Promise.resolve(null);}
 return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',JPG_QUALITY));
}
export async function saveVideoPoster(id:string,blob:Blob):Promise<void>{
 if(!/^[a-f0-9-]{36}$/.test(id)||!blob.size||blob.size>256*1024)return;
 const response=await fetch('/api/videos/'+id+'/poster',{
  method:'PUT',body:blob,credentials:'same-origin',headers:{'Content-Type':'image/jpeg'},
 });
 if(!response.ok)throw new Error('No se pudo guardar la miniatura.');
}
export async function createVideoPosterFromUrl(url:string):Promise<Blob|null>{
 if(!/^\/api\/videos\/[a-f0-9-]{36}$/.test(url))return null;
 const video=document.createElement('video');
 video.muted=true;video.playsInline=true;video.preload='auto';
 video.src=url;
 try{
  await new Promise<void>((resolve,reject)=>{
   const ready=()=>{cleanup();resolve();};
   const error=()=>{cleanup();reject(new Error('No se pudo leer el fotograma.'));};
   const cleanup=()=>{
    video.removeEventListener('loadeddata',ready);
    video.removeEventListener('error',error);
   };
   video.addEventListener('loadeddata',ready,{once:true});
   video.addEventListener('error',error,{once:true});
   video.load();
  });
  if(Number.isFinite(video.duration)&&video.duration>1){
   const target=Math.min(1,video.duration*.25);
   await new Promise<void>(resolve=>{
    const end=()=>{clearTimeout(timer);video.removeEventListener('seeked',end);resolve();};
    const timer=setTimeout(end,5000);
    video.addEventListener('seeked',end,{once:true});
    video.currentTime=target;
   });
  }
  return await posterFromCanvas(video);
 }finally{
  video.pause();video.removeAttribute('src');video.load();video.remove();
 }
}
/** Serial backfill prevents 20 old videos from decoding simultaneously on a phone. */
let posterQueue=Promise.resolve();
export function schedulePosterBackfill(id:string,url:string):Promise<boolean>{
 const job=posterQueue.then(async()=>{
  const poster=await createVideoPosterFromUrl(url);
  if(!poster)return false;
  await saveVideoPoster(id,poster);
  return true;
 });
 posterQueue=job.then(()=>{},()=>{});
 return job;
}
