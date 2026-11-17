import {useEffect,useRef,useState} from 'react';
import type {ChangeEvent,MouseEvent,PointerEvent} from 'react';
import {Video,UploadCloud,Trash2,XCircle,CheckCircle2,X,Check} from 'lucide-react';
import {useVideoLibrary} from './useVideoLibrary';
import VideoPoster from './VideoPoster';
import './video-bank.css';
type Props={library:ReturnType<typeof useVideoLibrary>};

/** Two-column image-only grid. Video streams are created only when opened. */
export default function VideoBank({library}:Props){
 const {videos,error,progress,upload,cancel,remove}=library;
 const [message,setMessage]=useState('');
 const [deleting,setDeleting]=useState(false);
 const [viewer,setViewer]=useState<string|null>(null);
 const [selecting,setSelecting]=useState(false);
 const [selected,setSelected]=useState<Set<string>>(()=>new Set());
 const holdTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const holdStart=useRef<{x:number;y:number}|null>(null);
 const swallowClick=useRef(false);
 const active=videos.find(video=>video.id===viewer);
 const busy=!!progress||deleting;

 useEffect(()=>{
  if(!viewer)return;
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape')setViewer(null);};
  document.addEventListener('keydown',key);
  return ()=>document.removeEventListener('keydown',key);
 },[viewer]);
 useEffect(()=>()=>{if(holdTimer.current)clearTimeout(holdTimer.current);},[]);

 const onFile=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;setMessage('');
  try{await upload(file);setMessage('Video guardado en la biblioteca.');}
  catch{/* Specific conversion error comes from the upload hook. */}
 };
 const clearHold=()=>{
  if(holdTimer.current)clearTimeout(holdTimer.current);
  holdTimer.current=null;holdStart.current=null;
 };
 const toggle=(id:string)=>{
  setSelected(prev=>{
   const next=new Set(prev);
   if(next.has(id))next.delete(id);else next.add(id);
   return next;
  });
 };
 const startHold=(event:PointerEvent<HTMLButtonElement>,id:string)=>{
  swallowClick.current=false;
  if(selecting||event.button!==0)return;
  clearHold();
  holdStart.current={x:event.clientX,y:event.clientY};
  holdTimer.current=setTimeout(()=>{
   swallowClick.current=true;setSelecting(true);setSelected(new Set([id]));
   if('vibrate' in navigator)navigator.vibrate(12);
   clearHold();
  },520);
 };
 const trackHold=(event:PointerEvent<HTMLButtonElement>)=>{
  const origin=holdStart.current;
  if(origin&&Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>12)clearHold();
 };
 const context=(event:MouseEvent<HTMLButtonElement>,id:string)=>{
  event.preventDefault();clearHold();
  if(!selecting){swallowClick.current=true;setSelecting(true);setSelected(new Set([id]));}
  else toggle(id);
 };
 const tap=(id:string)=>{
  if(swallowClick.current){swallowClick.current=false;return;}
  if(selecting)toggle(id);else setViewer(id);
 };
 const trash=async(ids:string[])=>{
  if(!ids.length||busy)return;
  if(!window.confirm('¿Enviar '+ids.length+' video(s) a la Papelera? Se podrán restaurar.'))return;
  setDeleting(true);setMessage('');
  let removed=0;
  try{
   for(const id of ids){await remove(id);removed++;}
   setSelected(new Set());setSelecting(false);setViewer(null);
   setMessage(removed+' video(s) enviados a Papelera.');
  }catch{setMessage(removed+' enviados. No se pudieron mover los demás.');}
  finally{setDeleting(false);}
 };
 return <section className="page hn-video-bank">
  <div className="intro-line hn-video-head">
   <div><span className="eyebrow">HAVANA NICE · CLOUD LIBRARY</span>
    <h1>Biblioteca de videos</h1></div>
  </div>
  <label className={'btn primary hn-video-upload'+(progress?' busy':'')}>
   <UploadCloud size={18}/>{progress?'Procesando video…':'Subir videos'}
   <input type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*"
    disabled={busy} onChange={event=>void onFile(event)}/>
  </label>
  {progress&&<div className="hn-video-progress" role="status">
   <div><strong>{progress.phase==='converting'?'Convirtiendo':'Guardando'}</strong>
    <span>{progress.percent}%</span></div>
   <div className="hn-video-progress-track"><span style={{width:progress.percent+'%'}}/></div>
   <button type="button" onClick={cancel}><XCircle size={16}/> Cancelar</button>
  </div>}
  {error&&<p className="hn-video-error" role="alert">{error}</p>}
  {message&&<p className="hn-video-success" role="status"><CheckCircle2 size={17}/>{message}</p>}
  {selecting&&<div className="hn-photo-selection-bar hn-video-selection-bar" role="toolbar" aria-label="Selección de videos">
   <strong>{selected.size} seleccionados</strong>
   <div>
    <button type="button" onClick={()=>{setSelecting(false);setSelected(new Set());}} disabled={busy}>Cancelar</button>
    <button type="button" className="danger" disabled={busy||!selected.size}
      onClick={()=>void trash([...selected])}><Trash2 size={17}/> Papelera</button>
   </div>
  </div>}
  {videos.length?<div className="hn-photo-bank-grid hn-video-grid"
     aria-label="Biblioteca de videos. Toca para ver o mantén pulsado para seleccionar.">
    {videos.map((video,index)=><button type="button" key={video.id}
      className={'hn-photo-bank-item hn-video-tile'+(selecting&&selected.has(video.id)?' is-selected':'')}
      aria-label={(selecting?'Seleccionar ':'Abrir video ')+video.name}
      aria-pressed={selecting?selected.has(video.id):undefined}
      onPointerDown={event=>startHold(event,video.id)}
      onPointerMove={trackHold} onPointerUp={clearHold}
      onPointerLeave={clearHold} onPointerCancel={clearHold}
      onContextMenu={event=>context(event,video.id)}
      onClick={()=>tap(video.id)}>
      <VideoPoster video={video} priority={index<4}/>
      {selecting&&selected.has(video.id)&&<span className="hn-photo-check" aria-hidden="true">
        <Check size={17}/></span>}
    </button>)}
   </div>:<div className="hn-video-empty"><Video size={30}/>
    <p>Tu biblioteca está lista para recibir videos.</p></div>}
  {active&&<div className="hn-video-lightbox" role="dialog" aria-modal="true" aria-label="Visor de video"
    onClick={event=>{if(event.target===event.currentTarget)setViewer(null);}}>
    <button type="button" className="hn-video-close" aria-label="Cerrar video" onClick={()=>setViewer(null)}>
      <X size={24}/></button>
    <video key={active.id} src={active.url} playsInline controls autoPlay preload="metadata"
      aria-label={active.name}/>
    <button type="button" className="hn-video-trash" aria-label="Enviar video a Papelera"
      disabled={busy} onClick={()=>void trash([active.id])}><Trash2 size={19}/></button>
   </div>}
 </section>;
}
