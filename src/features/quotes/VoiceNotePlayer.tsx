import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RefreshCw,Volume2} from 'lucide-react';
import {upgradeExistingVoice} from './voice-audio';
import './voice-note.css';
type Props={url:string;mime?:string|null;label?:string;owner?:boolean};
const clock=(secs:number)=>{
 const time=Number.isFinite(secs)&&secs>0?Math.floor(secs):0;
 return Math.floor(time/60)+':'+String(time%60).padStart(2,'0');
};
export default function VoiceNotePlayer({url,mime,label='Voice note',owner=false}:Props){
 const ref=useRef<HTMLAudioElement|null>(null);
 const [playing,setPlaying]=useState(false);
 const [duration,setDuration]=useState(0);
 const [current,setCurrent]=useState(0);
 const [failed,setFailed]=useState(false);
 const [repairing,setRepairing]=useState(false);
 const [version,setVersion]=useState(0);
 useEffect(()=>{
  setPlaying(false);setDuration(0);setCurrent(0);setFailed(false);setVersion(0);
 },[url]);
 useEffect(()=>{
  if(!owner||mime!=='audio/webm'||!url)return;
  let cancelled=false;
  setRepairing(true);
  void upgradeExistingVoice(url).then(ok=>{
   if(!cancelled&&ok){setVersion(x=>x+1);setFailed(false);}
  }).finally(()=>{if(!cancelled)setRepairing(false);});
  return ()=>{cancelled=true;};
 },[url,mime,owner]);
 const play=async()=>{
  const audio=ref.current;if(!audio||!url)return;
  if(!audio.paused){audio.pause();return;}
  try{await audio.play();setFailed(false);}
  catch{setFailed(true);}
 };
 const errorLabel=owner
  ?'Audio pendiente de conversión para iPhone.'
  :'Este audio todavía no es compatible con tu dispositivo.';
 return <div className="hn-voice-note" onClick={e=>e.stopPropagation()}>
  <audio ref={ref} src={version?url+'?v='+version:url} preload="metadata"
    onLoadedMetadata={e=>setDuration(e.currentTarget.duration||0)}
    onTimeUpdate={e=>setCurrent(e.currentTarget.currentTime)}
    onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
    onEnded={()=>{setPlaying(false);setCurrent(0);}}
    onError={()=>setFailed(true)} />
  <button className="hn-voice-play" type="button" onClick={()=>void play()}
    disabled={!url||repairing} aria-label={playing?'Pause voice note':'Play voice note'}>
    {repairing?<RefreshCw size={15}/>:playing?<Pause size={17}/>:<Play size={17}/>}
  </button>
  <div className="hn-voice-info"><span className="hn-voice-label"><Volume2 size={13}/>{label}</span>
   <div className="hn-voice-progress" role="progressbar"
    aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={duration?Math.min(100,Math.floor(current/duration*100)):0}>
    <span style={{width:(duration?current/duration*100:0)+'%'}} />
   </div>
  </div>
  <time className="hn-voice-time">{repairing?'…':clock(duration||current)}</time>
  {failed&&!repairing&&<small className="hn-voice-warning">{errorLabel}</small>}
 </div>;
}
