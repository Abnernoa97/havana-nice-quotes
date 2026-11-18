/** Cross-platform voice notes. Safari records AAC/mp4; Android Chrome may record
 * Opus/WebM which Safari cannot decode. Normalize WebM -> 16kHz mono PCM WAV
 * on the recording device before uploading (max 90s ~2.9MB). */
export const preferredVoiceMime=():string|undefined=>{
 if(typeof MediaRecorder==='undefined')return undefined;
 return ['audio/mp4;codecs=mp4a.40.2','audio/mp4',
   'audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
   .find(mime=>MediaRecorder.isTypeSupported(mime));
};
function toWav(audio:AudioBuffer,sampleRate=16000):Blob{
 const length=Math.ceil(audio.duration*sampleRate);
 const buffer=new ArrayBuffer(44+length*2);
 const view=new DataView(buffer);
 const ascii=(position:number,text:string)=>{for(let i=0;i<text.length;i++)view.setUint8(position+i,text.charCodeAt(i));};
 ascii(0,'RIFF');view.setUint32(4,36+length*2,true);ascii(8,'WAVE');
 ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
 view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);
 view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);
 view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,length*2,true);
 // Resample without large intermediate AudioBuffers; always mono for speech.
 const channels=Array.from({length:audio.numberOfChannels},(_,i)=>audio.getChannelData(i));
 for(let i=0;i<length;i++){
  const index=Math.min(audio.length-1,i*audio.sampleRate/sampleRate),lo=Math.floor(index);
  const hi=Math.min(lo+1,audio.length-1),frac=index-lo;
  let v=0;
  for(const samples of channels)v+=samples[lo]*(1-frac)+samples[hi]*frac;
  v=Math.max(-1,Math.min(1,v/channels.length));
  view.setInt16(44+i*2,v<0?Math.round(v*32768):Math.round(v*32767),true);
 }
 return new Blob([buffer],{type:'audio/wav'});
}
export async function compatibleVoice(blob:Blob):Promise<Blob>{
 const mime=blob.type.split(';')[0].toLowerCase();
 if(mime==='audio/mp4'||mime==='audio/wav'||mime==='audio/mpeg')return blob;
 if(!['audio/webm','audio/ogg'].includes(mime))throw Error('Formato de voz no compatible.');
 const AudioContextCtor=window.AudioContext;
 if(!AudioContextCtor)throw Error('No se puede convertir audio en este dispositivo.');
 const context=new AudioContextCtor();
 try{
  const decoded=await context.decodeAudioData(await blob.arrayBuffer());
  if(!decoded.length||!decoded.duration||decoded.duration>92)
   throw Error('La grabación es demasiado larga.');
  const wav=toWav(decoded);
  if(wav.size>6*1024*1024)throw Error('La nota de voz supera el tamaño permitido.');
  return wav;
 }finally{void context.close().catch(()=>{});}
}
/** Existing Android WebM notes can be repaired without losing the source
 * by opening the inbox on an authorized Chrome/Android device once. */
const repairs=new Map<string,Promise<boolean>>();
export function upgradeExistingVoice(audioUrl:string):Promise<boolean>{
 const prior=repairs.get(audioUrl);if(prior)return prior;
 const job=(async()=>{
  const result=await fetch(audioUrl,{credentials:'same-origin',cache:'no-store'});
  if(!result.ok)return false;
  const audio=new Blob([await result.arrayBuffer()],{type:'audio/webm'});
  const wav=await compatibleVoice(audio);
  const uploaded=await fetch(audioUrl+'/compatible',{
   method:'PUT',credentials:'same-origin',headers:{'Content-Type':'audio/wav'},body:wav
  });
  return uploaded.ok;
 })().catch(()=>false);
 repairs.set(audioUrl,job);
 return job;
}
