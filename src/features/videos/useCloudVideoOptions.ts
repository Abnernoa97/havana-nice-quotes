import {useEffect,useState} from 'react';
import type {CloudVideo} from './useVideoLibrary';

/** Read-only list shared by the cover cloud picker. No upload/encoding side effects. */
export function useCloudVideoOptions(active:boolean){
 const [videos,setVideos]=useState<CloudVideo[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!active)return;
  const abort=new AbortController();
  setLoading(true);setError('');
  fetch('/api/videos',{credentials:'same-origin',cache:'no-store',signal:abort.signal})
   .then(async response=>{
    if(!response.ok)throw new Error('No se pudo abrir la biblioteca de videos.');
    return response.json() as Promise<{videos:CloudVideo[]}>;
   })
   .then(data=>setVideos(data.videos.filter(item=>/^\/api\/videos\/[a-f0-9-]{36}$/.test(item.url))))
   .catch(()=>{if(!abort.signal.aborted)setError('No se pudo cargar los videos. Inténtalo nuevamente.');})
   .finally(()=>{if(!abort.signal.aborted)setLoading(false);});
  return ()=>abort.abort();
 },[active]);
 return {videos,loading,error};
}
