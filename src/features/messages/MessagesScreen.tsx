import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Bell,MessageCircle,Mic,Send,Square} from 'lucide-react';
import VoiceNotePlayer from '../quotes/VoiceNotePlayer';
import {compatibleVoice,preferredVoiceMime} from '../quotes/voice-audio';
import type {InboxConversation} from './useLiveInbox';
import './messages-inbox.css';

type Message={
 id:string;cursor:number;pageId:number;kind:'text'|'audio';sender:'owner'|'client';
 text:string;createdAt:number;audioUrl:string|null;mime?:string|null;
};
type Props={
 conversations:InboxConversation[];
 unreadTotal:number;loading:boolean;error:string;
 permission:string;askNotifications:()=>Promise<void>;
 refresh:()=>Promise<void>;openQuote:(id:string)=>void;initialQuoteId?:string;
};
const formatTime=(secs:number)=>new Date(secs*1000).toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'});
const formatDay=(secs:number)=>{
 const d=new Date(secs*1000),now=new Date(),y=new Date(now);y.setDate(now.getDate()-1);
 return d.toDateString()===now.toDateString()?'Hoy':
  d.toDateString()===y.toDateString()?'Ayer':
  d.toLocaleDateString('es-MX',{day:'numeric',month:'short'});
};
export default function MessagesScreen({
 conversations,unreadTotal,loading,error,permission,askNotifications,refresh,openQuote,initialQuoteId
}:Props){
 const [selectedId,setSelectedId]=useState<string|null>(initialQuoteId||null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [draft,setDraft]=useState('');
 const [sendBusy,setSendBusy]=useState(false);
 const [threadError,setThreadError]=useState('');
 const [threadLoading,setThreadLoading]=useState(false);
 const [recording,setRecording]=useState(false);
 const recordingRef=useRef<MediaRecorder|null>(null);
 const streamRef=useRef<MediaStream|null>(null);
 const chunksRef=useRef<Blob[]>([]);
 const stopTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const containerRef=useRef<HTMLDivElement|null>(null);
 const fetchingRef=useRef(false);
 const readCursorRef=useRef(0);
 const selected=conversations.find(c=>c.quoteId===selectedId)||null;
 const base=selectedId?'/api/quote-inbox/'+encodeURIComponent(selectedId):'';
 const threadPage=selected?.pageId;
 useEffect(()=>{
  if(initialQuoteId)setSelectedId(initialQuoteId);
 },[initialQuoteId]);
 useEffect(()=>{
  // Do not silently mark a conversation read on opening the inbox itself.
  if(selectedId&&!conversations.some(c=>c.quoteId===selectedId))setSelectedId(null);
 },[conversations,selectedId]);
 useEffect(()=>{
  setMessages([]);setThreadLoading(true);setThreadError('');
  readCursorRef.current=0;
 },[selectedId]);
 useEffect(()=>{
  if(!selectedId)return;
  let mounted=true;
  const load=async()=>{
   if(fetchingRef.current||document.hidden)return;
   fetchingRef.current=true;
   try{
    const response=await fetch(base,{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('No se pudo abrir la conversación.');
    const data=await response.json() as {messages:Message[]};
    if(!mounted)return;
    setMessages(data.messages||[]);
    setThreadError('');
    const cursor=data.messages?.length?data.messages[data.messages.length-1].cursor:undefined;
    if(cursor!==undefined&&cursor>readCursorRef.current){
     const ack=await fetch(base+'/read',{
      method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({cursor})
     });
     if(ack.ok){readCursorRef.current=cursor;void refresh();}
    }
   }catch{if(mounted)setThreadError('No pudimos actualizar esta conversación.');}
   finally{fetchingRef.current=false;if(mounted)setThreadLoading(false);}
  };
  void load();
  const timer=setInterval(()=>{if(!document.hidden)void load();},2500);
  const resume=()=>{if(!document.hidden)void load();};
  document.addEventListener('visibilitychange',resume);
  return ()=>{mounted=false;clearInterval(timer);fetchingRef.current=false;
   document.removeEventListener('visibilitychange',resume);};
 },[base,selectedId,refresh]);
 useEffect(()=>{
  const el=containerRef.current;
  if(el)el.scrollTop=el.scrollHeight;
 },[messages.length,selectedId]);
 useEffect(()=>()=>{if(stopTimer.current)clearTimeout(stopTimer.current);
  if(recordingRef.current?.state==='recording')recordingRef.current.stop();
  streamRef.current?.getTracks().forEach(t=>t.stop());
 },[]);
 const send=async(body:BodyInit,mime:string)=>{
  if(sendBusy||!selectedId||threadPage===undefined)return;
  setSendBusy(true);setThreadError('');
  try{
   const response=await fetch('/api/quote-chat/'+encodeURIComponent(selectedId)+'/'+threadPage,{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':mime},body
   });
   const result=await response.json() as {error?:string;message?:Message};
   if(!response.ok)throw Error(result.error||'No se pudo enviar.');
   setDraft('');
   const read=await fetch(base,{credentials:'same-origin',cache:'no-store'});
   if(read.ok){const data=await read.json() as {messages:Message[]};setMessages(data.messages||[]);}
   void refresh();
  }catch(cause){setThreadError(cause instanceof Error?cause.message:'Error al enviar.');}
  finally{setSendBusy(false);}
 };
 const sendText=()=>{
  if(draft.trim())void send(JSON.stringify({text:draft.trim()}),'application/json');
 };
 const stopRecording=()=>{
  if(recordingRef.current?.state==='recording')recordingRef.current.stop();
  if(stopTimer.current){clearTimeout(stopTimer.current);stopTimer.current=null;}
  setRecording(false);
 };
 const startRecording=async()=>{
  if(recording){stopRecording();return;}
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
   setThreadError('El navegador no permite grabar audio.');return;
  }
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});
   streamRef.current=stream;
   const mime=preferredVoiceMime();
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
   recordingRef.current=recorder;chunksRef.current=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data);};
   recorder.onstop=()=>{
    stream.getTracks().forEach(track=>track.stop());streamRef.current=null;
    if(stopTimer.current){clearTimeout(stopTimer.current);stopTimer.current=null;}
    setRecording(false);
    const blob=new Blob(chunksRef.current,{type:recorder.mimeType});
    chunksRef.current=[];
    if(!blob.size)return;
    void compatibleVoice(blob).then(audio=>{
      if(audio.size>6*1024*1024)throw Error('Nota de voz demasiado grande.');
      return send(audio,audio.type.split(';')[0]);
    }).catch(cause=>setThreadError(cause instanceof Error?cause.message:'Error de voz.'));
   };
   recorder.start(400);setRecording(true);
   stopTimer.current=setTimeout(stopRecording,90000);
  }catch{setThreadError('Activa el permiso del micrófono para grabar.');}
 };
 return <div className="page hn-messages-page">
  <header className="hn-messages-head">
   <div><span className="eyebrow">HAVANA NICE · CONVERSACIONES</span>
     <h1>Mensajes</h1></div>
   {permission==='default'&&
    <button type="button" className="hn-message-notify" onClick={()=>void askNotifications()}>
     <Bell size={17}/> Activar avisos
    </button>}
   {permission==='granted'&&<span className="hn-message-notifications-on">
     <Bell size={15}/> Avisos activados</span>}
  </header>
  <div className="hn-message-summary">
   <span>{conversations.length} {conversations.length===1?'conversación':'conversaciones'}</span>
   {unreadTotal>0&&<strong>{unreadTotal} {unreadTotal===1?'mensaje nuevo':'mensajes nuevos'}</strong>}
  </div>
  {error&&<p className="hn-messages-error" role="status">{error}</p>}
  <section className="hn-messages-layout" aria-label="Conversaciones por cotización">
   <aside className="hn-message-list" aria-label="Bandeja de conversaciones">
    {loading&&!conversations.length&&<p className="hn-message-empty">Conectando mensajes…</p>}
    {!loading&&!conversations.length&&<p className="hn-message-empty">
      Cuando un cliente escriba desde su cotización, aparecerá aquí automáticamente.</p>}
    {conversations.map(c=><button type="button" key={c.quoteId}
      onClick={()=>setSelectedId(c.quoteId)}
      className={'hn-message-row'+(c.quoteId===selectedId?' active':'')}>
      <span className="hn-message-avatar">{(c.title||'H')[0].toUpperCase()}</span>
      <span className="hn-message-row-info">
       <span className="hn-message-row-top"><strong>{c.title}</strong>
         <time>{formatDay(c.createdAt)}</time></span>
       <span className="hn-message-preview">
        {c.kind==='audio'?<><Mic size={14}/> Nota de voz</>:c.text||'Mensaje'}
       </span>
      </span>
      {c.unread>0&&<span className="hn-message-count" aria-label={c.unread+' sin leer'}>
       {c.unread>99?'99+':c.unread}</span>}
     </button>)}
   </aside>
   <article className="hn-message-thread" aria-label="Conversación">
    {!selected?<div className="hn-message-placeholder"><MessageCircle size={27}/>
      Selecciona una conversación</div>:<>
      <header className="hn-message-thread-head">
       <div><strong>{selected.title}</strong>
        <small>{selected.couple&&selected.couple!==selected.title?selected.couple+' · ':''}Cotización</small></div>
       <button type="button" onClick={()=>openQuote(selected.quoteId)}
        title="Abrir cotización completa"><ArrowUpRight size={16}/> Ver cotización</button>
      </header>
      <div className="hn-thread-bubbles" ref={containerRef} role="log" aria-label="Historial de mensajes">
       {threadLoading&&messages.length===0&&<p className="hn-message-empty">Abriendo conversación…</p>}
       {messages.map(m=><div key={m.id} className={'hn-thread-msg '+(m.sender==='owner'?'owner':'client')}>
         {m.kind==='audio'?<VoiceNotePlayer url={m.audioUrl||''} mime={m.mime}
           label="Nota de voz" owner/>:<p>{m.text}</p>}
         <small>{m.sender==='owner'?'HAVANA NICE':'Cliente'} · {formatDay(m.createdAt)} {formatTime(m.createdAt)}</small>
        </div>)}
      </div>
      {threadError&&<p className="hn-messages-error" role="alert">{threadError}</p>}
      <div className="hn-message-compose">
       <textarea aria-label="Responder al cliente" placeholder="Escribir mensaje…"
        value={draft} rows={1} maxLength={1600}
        onChange={e=>setDraft(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText();}}}/>
       <button type="button" className="hn-compose-send"
        aria-label="Enviar mensaje" disabled={sendBusy||!draft.trim()} onClick={sendText}>
        <Send size={19}/></button>
       <button type="button" className={'hn-compose-record'+(recording?' recording':'')}
        disabled={sendBusy} aria-label={recording?'Detener nota de voz':'Grabar nota de voz'}
        onClick={()=>void startRecording()}>{recording?<Square size={18}/>:<Mic size={18}/>}</button>
      </div>
     </>}
   </article>
  </section>
 </div>;
}
