import {useEffect,useRef,useState} from 'react';
import type {ComponentProps} from 'react';
import {Settings2} from 'lucide-react';
import PhotoBank from '../photos/PhotoBank';
import VideoBank from './VideoBank';
import {useVideoLibrary} from './useVideoLibrary';
import MediaLibraryStats from './MediaLibraryStats';
import './media-library-screen.css';

type Props=ComponentProps<typeof PhotoBank>&{enabled:boolean};
/** One shared top control for both media libraries. Video metadata loads once. */
export default function MediaLibraryScreen({enabled,...photoProps}:Props){
 const [tab,setTab]=useState<'photo'|'video'>('photo');
 const [showStats,setShowStats]=useState(false);
 const menuRef=useRef<HTMLDivElement>(null);
 const videos=useVideoLibrary(enabled);
 useEffect(()=>{
  if(!showStats)return;
  const close=(event:PointerEvent)=>{
   if(menuRef.current&&!menuRef.current.contains(event.target as Node))setShowStats(false);
  };
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setShowStats(false);};
  document.addEventListener('pointerdown',close);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
 },[showStats]);
 const update=()=>{void Promise.all([photoProps.refreshPhotos(),videos.refresh()]);};
 return <div className="hn-media-library-screen">
  <div className="hn-media-library-toolbar">
   <nav className="hn-media-library-tabs" aria-label="Tipo de archivo">
    <button type="button" className={tab==='photo'?'selected':''}
      aria-pressed={tab==='photo'} onClick={()=>setTab('photo')}>Fotografías</button>
    <button type="button" className={tab==='video'?'selected':''}
      aria-pressed={tab==='video'} onClick={()=>setTab('video')}>Videos</button>
   </nav>
   <div className="hn-media-settings-anchor" ref={menuRef}>
    <button type="button" className={'hn-media-settings'+(showStats?' active':'')}
      aria-label="Estadísticas de fotos, videos y almacenamiento"
      aria-expanded={showStats} aria-controls="hn-media-stats"
      onClick={()=>setShowStats(open=>!open)}><Settings2 size={19}/></button>
    {showStats&&<MediaLibraryStats photoCount={photoProps.photos.length}
      videoCount={videos.videos.length} photoBytes={photoProps.bytesUsed}
      videoBytes={videos.bytesUsed} refresh={update}
      busy={photoProps.uploading||Boolean(videos.progress)}/>}
   </div>
  </div>
  {tab==='photo'?<PhotoBank {...photoProps}/>:<VideoBank library={videos}/>}
 </div>;
}
