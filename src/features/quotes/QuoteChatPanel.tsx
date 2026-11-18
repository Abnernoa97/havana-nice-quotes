import {useEffect,useRef,useState} from 'react';
import {Mic,Send,Square} from 'lucide-react';
import {compatibleVoice,preferredVoiceMime} from './voice-audio';
import VoiceNotePlayer from './VoiceNotePlayer';
import './quote-chat.css';

type Message={id:string;sender:'owner'|'client';kind:'text'|'audio';
 text:string;audioUrl:string|null;mime?:string|null;createdAt:number};
type Props={quoteId:string;pageId:number;compact?:boolean;staticPreview?:boolean;isTemplate?:boolean};
const token=typeof window!=='undefined'
 ?window.location.pathname.match(/^\/q\/([a-f0-9]{64})\/?$/)?.[1]:undefined;
const client=Boolean(token);
const endpoint=(quoteId:string,pageId:number)=>client
 ?'/api/shared/'+token+'/chat/'+pageId
 :'/api/quote-chat/'+quoteId+'/'+pageId;
const fmt=(time:number)=>new Date(time*1000).toLocaleTimeString(client?'en-US':'es-MX',{
 hour:'numeric',minute:'2-digit'
});
/** Authenticated owner or share-token client — no photo/video attachment path.
 * The 3D magazine clones DOM: live composers are mounted OUTSIDE PageFlip. */
export default function QuoteChatPanel({quoteId,pageId,compact=false,staticPreview=false,isTemplate=false}:Props){
 const [messages,setMessages]=useState<Message[]>([]);
 const [text,setText]=useState('');
 const [error,setError]=useState('');
 const [sending,setSending]=useState(false);
 const [recording,setRecording]=useState(false);
 const [available,setAvailable]=useState(!isTemplate);
 const recorder=useRef<MediaRecorder|null>(null);
 const stream=useRef<MediaStream|null>(null);
 const chunks=useRef<Blob[]>([]);
 const stopTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const messageBox=useRef<HTMLDivElement|null>(null);
 const url=endpoint(quoteId,pageId);
 const who=client?'client':'owner';
 const translate=(owner:string,visitor:string)=>client?visitor:owner;
 useEffect(()=>{
  if(staticPreview||isTemplate)return;
  let mounted=true;
  const refresh=async()=>{
   if(document.hidden)return;
   try{
    const response=await fetch(url,{cache:'no-store',credentials:client?'omit':'same-origin'});
    if(!response.ok){if(response.status===404&&mounted)setAvailable(false);return;}
    const data=await response.json() as {messages?:Message[]};
    if(mounted){setMessages(data.messages||[]);setAvailable(true);}
   }catch{/* Keep already rendered chat offline. */}
  };
  void refresh();
  const refreshInterval=setInterval(()=>void refresh(),7000);
  const wake=()=>{if(!document.hidden)void refresh();};
  document.addEventListener('visibilitychange',wake);
  return ()=>{mounted=false;clearInterval(refreshInterval);
   document.removeEventListener('visibilitychange',wake);};
 },[url,isTemplate,staticPreview]);
 useEffect(()=>{const el=messageBox.current;if(el)el.scrollTop=el.scrollHeight;},[messages.length]);
 useEffect(()=>()=>{if(stopTimer.current)clearTimeout(stopTimer.current);
  if(recorder.current?.state==='recording')recorder.current.stop();
  stream.current?.getTracks().forEach(t=>t.stop());
 },[]);
 const send=async(body:BodyInit,mime:string)=>{
  if(sending)return;
  setSending(true);setError('');
  try{
   const response=await fetch(url,{method:'POST',body,
    headers:{'Content-Type':mime},credentials:client?'omit':'same-origin'});
   const result=await response.json() as {message?:Message;error?:string};
   if(!response.ok||!result.message)throw Error(result.error||translate('Error al enviar.','Message could not be sent.'));
   setMessages(prev=>[...prev,result.message!]);setText('');
  }catch(cause){setError(cause instanceof Error?cause.message:'Error');}
  finally{setSending(false);}
 };
 const sendText=()=>{const content=text.trim();if(content)void send(JSON.stringify({text:content}),'application/json');};
 const endRecording=()=>{
  if(recorder.current?.state==='recording')recorder.current.stop();
  setRecording(false);
  if(stopTimer.current){clearTimeout(stopTimer.current);stopTimer.current=null;}
 };
 const beginRecording=async()=>{
  if(recording){endRecording();return;}
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
   setError(translate('El micrófono no está disponible.','Microphone unavailable.'));return;
  }
  setError('');
  try{
   const mic=await navigator.mediaDevices.getUserMedia({audio:true});
   stream.current=mic;
   const selected=preferredVoiceMime();
   const media=new MediaRecorder(mic,selected?{mimeType:selected}:undefined);
   recorder.current=media;chunks.current=[];
   media.ondataavailable=event=>{if(event.data.size>0)chunks.current.push(event.data);};
   media.onstop=()=>{
    setRecording(false);
    mic.getTracks().forEach(track=>track.stop());
    stream.current=null;
    const blob=new Blob(chunks.current,{type:media.mimeType});
    chunks.current=[];
    if(!blob.size)return;
    void compatibleVoice(blob).then(audio=>{
      if(audio.size<=6*1024*1024)return send(audio,audio.type.split(';')[0]);
      throw Error(translate('Audio demasiado largo.','Recording is too long.'));
    }).catch(cause=>setError(cause instanceof Error?cause.message:'Error de audio.'));
   };
   media.start(500);setRecording(true);
   stopTimer.current=setTimeout(endRecording,90000);
  }catch{setError(translate('Autoriza el micrófono en el navegador.','Please allow microphone access.'));}
 };
 const disabled=staticPreview||isTemplate||!available||sending;
 return <div className={'hn-quote-chat'+(compact?' hn-quote-chat-compact':'')+
  (staticPreview?' hn-quote-chat-static':'')} data-hn-chat
  onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
  <div className="hn-quote-chat-top"><span className="hn-quote-chat-dot"/>
   {translate('Conversación privada','Private conversation')}</div>
  {!staticPreview&&<div ref={messageBox} className="hn-quote-chat-messages" role="log"
     aria-label={translate('Mensajes de la cotización','Proposal messages')}>
    {messages.length===0&&<p className="hn-quote-chat-empty">{translate(
     'Escribe un mensaje o envía una nota de voz.',
     'Send a message or voice note.')}</p>}
    {messages.map(msg=><div key={msg.id}
       className={'hn-chat-bubble'+(msg.sender===who?' mine':' theirs')}>
       {msg.kind==='audio'?<VoiceNotePlayer url={msg.audioUrl||''} mime={msg.mime}
          label={translate('Nota de voz','Voice note')}/>
        :<span>{msg.text}</span>}
       <small>{fmt(msg.createdAt)}</small>
      </div>)}

  </div>}
  <div className="hn-quote-chat-compose">
   <textarea value={text} disabled={disabled} rows={1}
     maxLength={1600} placeholder={translate('Escribir mensaje…','Write a message…')}
     aria-label={translate('Escribir mensaje','Write a message')}
     onChange={e=>setText(e.target.value)}
     onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText();}}}/>
   <button type="button" disabled={disabled||!text.trim()||recording}
     onClick={sendText} className="hn-chat-send"
     aria-label={recording?'Stop recording':'Send message'}>
      {recording?<Square size={17}/>:<Send size={19}/>}
   </button>
   <button type="button" disabled={disabled}
     onClick={()=>void beginRecording()}
     className={'hn-chat-mic'+(recording?' recording':'')}
     aria-label={recording?'Detener grabación':'Grabar nota de voz'}>
      {recording?<Square size={18}/>:<Mic size={19}/>}
   </button>
  </div>
  {!available&&!staticPreview&&<p className="hn-chat-hint">{translate(
   'Guarda esta cotización para activar el chat.',
   'This conversation is available after the proposal is saved.')}</p>}
  {!!error&&<p className="hn-chat-error" role="alert">{error}</p>}
 </div>;
}
