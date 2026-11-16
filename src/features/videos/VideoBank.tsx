import { useRef,useState } from 'react';
import type { ChangeEvent } from 'react';
import { Video,UploadCloud,Trash2,RefreshCw,XCircle,CheckCircle2 } from 'lucide-react';
import { useVideoLibrary,videoSize } from './useVideoLibrary';
import './video-bank.css';
type Props={enabled:boolean};

/** Video-only gallery. The raw input never goes to R2; conversion happens first. */
export default function VideoBank({enabled}:Props){
 const {videos,bytesUsed,error,progress,lastSaved,upload,cancel,remove,refresh}=useVideoLibrary(enabled);
 const [message,setMessage]=useState('');
 const [deleting,setDeleting]=useState<string|null>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const onFile=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;
  setMessage('');
  try{
   const result=await upload(file);
   setMessage('Video web guardado. '+videoSize(result.originalBytes)+' → '+videoSize(result.convertedBytes)+'.');
  }catch{/* The hook exposes the specific conversion error. */}
 };
 const onTrash=async(id:string,name:string)=>{
  if(!window.confirm('¿Mover «'+name+'» a la Papelera? Se podrá restaurar.'))return;
  setDeleting(id);setMessage('');
  try{await remove(id);setMessage('Video enviado a Papelera.');}
  catch{setMessage('No se pudo mover el video a Papelera.');}
  finally{setDeleting(null);}
 };
 return <section className="page hn-video-bank">
  <div className="hn-video-head">
   <div><span className="eyebrow">HAVANA NICE · CLOUD LIBRARY</span>
    <h1>Biblioteca de videos</h1>
    <p>Se convierten en el teléfono y guardamos únicamente la versión web, con audio, en R2 privado.</p></div>
   <button type="button" className="hn-video-refresh" aria-label="Actualizar videos"
    disabled={!!progress} onClick={()=>void refresh()}><RefreshCw size={18}/></button>
  </div>
  <label className={'hn-video-upload'+(progress?' busy':'')}>
   <UploadCloud size={19}/>{progress?'Procesando video…':'Subir y convertir video'}
   <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*"
    disabled={!!progress||!!deleting} onChange={event=>void onFile(event)}/>
  </label>
  <p className="hn-video-note">Compresión local automática: hasta 1280 px, 24 fps, audio incluido.
   Mantén esta pantalla abierta durante la conversión. No se sube el original.</p>
  {progress&&<div className="hn-video-progress" role="status">
   <div><strong>{progress.phase==='converting'?'Comprimiendo en el teléfono':'Guardando en la nube'}</strong>
    <span>{progress.percent}%</span></div>
   <div className="hn-video-progress-track"><span style={{width:progress.percent+'%'}}/></div>
   <small>{videoSize(progress.originalBytes)} original
    {progress.convertedBytes!==undefined?' · '+videoSize(progress.convertedBytes)+' convertido':''}</small>
   <button type="button" onClick={cancel}><XCircle size={16}/> Cancelar</button>
  </div>}
  {error&&<p className="hn-video-error" role="alert">{error}</p>}
  {message&&<p className="hn-video-success" role="status"><CheckCircle2 size={17}/>{message}</p>}
  <div className="hn-video-summary"><Video size={17}/><strong>{videos.length}</strong> videos web
   <span>{videoSize(bytesUsed)} almacenados</span></div>
  {videos.length?<div className="hn-video-grid">
   {videos.map(item=><article key={item.id} className="hn-video-card">
    <video src={item.url} preload="metadata" controls playsInline aria-label={'Reproducir '+item.name}/>
    <div className="hn-video-card-details">
     <div><strong>{item.name}</strong><small>{videoSize(item.size)} · {item.mime==='video/mp4'?'MP4 web':'WebM web'}</small></div>
     <button type="button" title="Mover video a Papelera" aria-label={'Eliminar '+item.name}
      disabled={!!progress||!!deleting} onClick={()=>void onTrash(item.id,item.name)}><Trash2 size={17}/></button>
    </div>
   </article>)}
  </div>:<div className="hn-video-empty"><Video size={30}/>
   <p>Cuando subas tu primer video, aparecerá aquí ya convertido.</p></div>}
  {lastSaved&&<small className="hn-video-compression">Última conversión: {videoSize(lastSaved.originalBytes)}
   {' → '}{videoSize(lastSaved.convertedBytes)}.</small>}
 </section>;
}
