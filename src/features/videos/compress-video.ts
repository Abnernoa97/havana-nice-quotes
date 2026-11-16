/**
 * No server transcoding fees: render video at a web-friendly size and record
 * with the phone's hardware media encoder. Keep stereo audio through Web Audio.
 * Only the converted Blob is returned for R2; original is never uploaded.
 *
 * Requires a foreground mobile browser with canvas.captureStream, MediaRecorder,
 * playable source codec and AudioContext. If any stage fails, DO NOT upload raw.
 */
export type WebVideo={file:File;originalBytes:number;convertedBytes:number;duration:number};
const VIDEO_EDGE=1280;
const FRAME_RATE=24;
const VIDEO_BITRATE=2_200_000;
const AUDIO_BITRATE=128_000;
function chooseFormat():{mime:string;extension:string;outputMime:string}{
 const formats=[
  {mime:'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',extension:'mp4',outputMime:'video/mp4'},
  {mime:'video/mp4',extension:'mp4',outputMime:'video/mp4'},
  {mime:'video/webm;codecs=vp8,opus',extension:'webm',outputMime:'video/webm'},
  {mime:'video/webm;codecs=vp9,opus',extension:'webm',outputMime:'video/webm'},
  {mime:'video/webm',extension:'webm',outputMime:'video/webm'},
 ];
 const supported=formats.find(format=>MediaRecorder.isTypeSupported(format.mime));
 if(!supported)throw new Error('Este navegador no permite convertir videos web. Prueba Chrome o Safari actualizado.');
 return supported;
}
const stopped=(signal?:AbortSignal)=>signal?.aborted===true;
function videoDimensions(width:number,height:number){
 if(width<=0||height<=0)throw new Error('El archivo no tiene dimensiones de video válidas.');
 const ratio=Math.min(1,VIDEO_EDGE/Math.max(width,height));
 return {
  width:Math.max(2,Math.floor(width*ratio/2)*2),
  height:Math.max(2,Math.floor(height*ratio/2)*2),
 };
}
async function metadata(video:HTMLVideoElement,signal?:AbortSignal):Promise<void>{
 if(video.readyState>=1)return;
 await new Promise<void>((resolve,reject)=>{
  const ok=()=>{finish();resolve();};
  const fail=()=>{finish();reject(new Error('No se puede abrir este formato de video en el teléfono.'));};
  const cancel=()=>{finish();reject(new Error('Conversión cancelada.'));};
  const finish=()=>{
   video.removeEventListener('loadedmetadata',ok);
   video.removeEventListener('error',fail);
   signal?.removeEventListener('abort',cancel);
  };
  video.addEventListener('loadedmetadata',ok,{once:true});
  video.addEventListener('error',fail,{once:true});
  signal?.addEventListener('abort',cancel,{once:true});
  if(stopped(signal))cancel();
 });
}
export async function compressVideoForWeb(source:File,
 onProgress:(value:number)=>void,
 signal?:AbortSignal):Promise<WebVideo>{
 if(!source.type.startsWith('video/')&&!/\.(mp4|mov|m4v|webm|mkv)$/i.test(source.name))
  throw new Error('Selecciona un video MP4, MOV, WebM o MKV.');
 if(source.size===0)throw new Error('El video está vacío.');
 if(stopped(signal))throw new Error('Conversión cancelada.');
 if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function'||
    typeof AudioContext==='undefined')throw new Error('Este teléfono no permite compresión local con audio.');
 const format=chooseFormat();
 const url=URL.createObjectURL(source);
 const video=document.createElement('video');
 video.src=url;video.preload='auto';video.playsInline=true;video.muted=true;
 video.setAttribute('playsinline','');
 video.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-20px;top:-20px;';
 document.body.appendChild(video);
 let recorder:MediaRecorder|undefined,audio:AudioContext|undefined,frame=0;
 let stream:MediaStream|undefined;
 try{
  // Resume while we are still handling the file-picker user interaction.
  audio=new AudioContext();
  const resume=audio.resume();
  await metadata(video,signal);
  await resume;
  if(audio.state!=='running')throw new Error('Activa la reproducción de audio para convertir el video.');
  if(!Number.isFinite(video.duration)||video.duration<=0)
   throw new Error('No se pudo leer la duración del video.');
  const dim=videoDimensions(video.videoWidth,video.videoHeight);
  const canvas=document.createElement('canvas');
  canvas.width=dim.width;canvas.height=dim.height;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('No se pudo iniciar el codificador de video.');
  const sourceNode=audio.createMediaElementSource(video);
  const audioDest=audio.createMediaStreamDestination();
  sourceNode.connect(audioDest);
  stream=canvas.captureStream(FRAME_RATE);
  for(const track of audioDest.stream.getAudioTracks())stream.addTrack(track);
  recorder=new MediaRecorder(stream,{
   mimeType:format.mime,videoBitsPerSecond:VIDEO_BITRATE,audioBitsPerSecond:AUDIO_BITRATE,
  });
  const parts:Blob[]=[];
  const finished=new Promise<Blob>((resolve,reject)=>{
   let settled=false;
   const done=(error?:Error)=>{
    if(settled)return;settled=true;
    if(error)reject(error);
    else resolve(new Blob(parts,{type:format.outputMime}));
   };
   recorder!.ondataavailable=event=>{if(event.data.size>0)parts.push(event.data);};
   recorder!.onerror=()=>done(new Error('Falló la compresión del video.'));
   recorder!.onstop=()=>done(stopped(signal)?new Error('Conversión cancelada.'):undefined);
   const abort=()=>{
    if(recorder?.state!=='inactive')recorder?.stop();
   };
   signal?.addEventListener('abort',abort,{once:true});
  });
  const paint=()=>{
   if(!video.paused&&!video.ended&&video.readyState>=2){
    try{ctx.drawImage(video,0,0,canvas.width,canvas.height);}catch{/* wait for first frame */}
   }
   if(video.duration>0)onProgress(Math.min(99,Math.round(video.currentTime/video.duration*100)));
   if(!video.ended&&recorder?.state!=='inactive'&&!stopped(signal))
    frame=requestAnimationFrame(paint);
  };
  const end=()=>{if(recorder?.state!=='inactive')recorder?.stop();};
  video.addEventListener('ended',end,{once:true});
  video.addEventListener('error',()=>{if(recorder?.state!=='inactive')recorder?.stop();},{once:true});
  recorder.start(1000);
  try{
   await video.play();
   ctx.drawImage(video,0,0,canvas.width,canvas.height);
   frame=requestAnimationFrame(paint);
  }catch(cause){
   if(recorder.state!=='inactive')recorder.stop();
   throw new Error('El navegador bloqueó la reproducción necesaria para convertir el video.');
  }
  const blob=await finished;
  if(stopped(signal))throw new Error('Conversión cancelada.');
  if(blob.size===0)throw new Error('No se pudo generar el video web.');
  const name=source.name.replace(/\.[^/.]+$/,'').slice(0,100)+'-web.'+format.extension;
  onProgress(100);
  return {file:new File([blob],name,{type:format.outputMime}),
   originalBytes:source.size,convertedBytes:blob.size,duration:video.duration};
 }finally{
  cancelAnimationFrame(frame);
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
  URL.revokeObjectURL(url);
  stream?.getTracks().forEach(track=>track.stop());
  if(recorder&&recorder.state!=='inactive')recorder.stop();
  if(audio)await audio.close().catch(()=>{});
 }
}
