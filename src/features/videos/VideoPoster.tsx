import {useEffect,useRef,useState} from 'react';
import type {CloudVideo} from './useVideoLibrary';
import {schedulePosterBackfill} from './video-posters';

type Props={video:CloudVideo;priority?:boolean};
/** A real JPEG thumbnail instead of one player/network stream per gallery item.
 * Preexisting videos are backfilled once, lazily and sequentially. */
export default function VideoPoster({video,priority=false}:Props){
 const host=useRef<HTMLDivElement>(null);
 const [missing,setMissing]=useState(false);
 const [version,setVersion]=useState(0);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  if(!missing)return;
  let cancelled=false,started=false;
  const start=()=>{
   if(started)return;started=true;
   void schedulePosterBackfill(video.id,video.url).then(done=>{
    if(cancelled)return;
    if(done){setVersion(v=>v+1);setMissing(false);}
    else setFailed(true);
   }).catch(()=>{if(!cancelled)setFailed(true);});
  };
  const node=host.current;
  if(!node)return;
  if(typeof IntersectionObserver==='undefined')start();
  else {
   const observer=new IntersectionObserver(entries=>{
    if(entries[0]?.isIntersecting){observer.disconnect();start();}
   },{rootMargin:'140px'});
   observer.observe(node);
   return ()=>{cancelled=true;observer.disconnect();};
  }
  return ()=>{cancelled=true;};
 },[missing,video.id,video.url]);
 return <div ref={host} className="hn-video-poster">
  {!failed&&<img src={(video.posterUrl||video.url+'/poster')+(version?'?generated='+version:'')}
    alt="" loading={priority?'eager':'lazy'} decoding="async"
    fetchPriority={priority?'high':'auto'}
    onError={()=>{if(!missing)setMissing(true);}} draggable={false}/>}
 </div>;
}
