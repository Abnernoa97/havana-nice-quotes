import { useState } from 'react';
import type { ComponentProps } from 'react';
import PhotoBank from '../photos/PhotoBank';
import VideoBank from './VideoBank';
import './media-library-screen.css';
type Props=ComponentProps<typeof PhotoBank>&{enabled:boolean};
/** Shared library navigation, without changing the existing Photos editor contract. */
export default function MediaLibraryScreen({enabled,...photoProps}:Props){
 const [tab,setTab]=useState<'photo'|'video'>('photo');
 return <div className="hn-media-library-screen">
  <nav className="hn-media-library-tabs" aria-label="Tipo de archivo">
   <button type="button" className={tab==='photo'?'selected':''}
    aria-pressed={tab==='photo'} onClick={()=>setTab('photo')}>Fotografías</button>
   <button type="button" className={tab==='video'?'selected':''}
    aria-pressed={tab==='video'} onClick={()=>setTab('video')}>Videos</button>
  </nav>
  {tab==='photo'?<PhotoBank {...photoProps}/>:<VideoBank enabled={enabled}/>}
 </div>;
}
