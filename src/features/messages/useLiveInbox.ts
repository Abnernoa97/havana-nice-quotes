import {useCallback,useEffect,useRef,useState} from 'react';

export type InboxConversation={
 quoteId:string;title:string;couple:string;pageId:number;
 kind:'text'|'audio';sender:'owner'|'client';text:string;
 createdAt:number;cursor:number;unread:number;
};
type ResponseData={conversations:InboxConversation[];unreadTotal:number};
const POLL_MS=2200;

/** A single owner-side poller runs across every workspace section, not only Mensajes.
 * Background tabs refresh immediately when they become visible again.
 * OS push with the PWA fully closed requires a separate Web Push subscription. */
export function useLiveInbox(enabled:boolean){
 const [conversations,setConversations]=useState<InboxConversation[]>([]);
 const [unreadTotal,setUnreadTotal]=useState(0);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [permission,setPermission]=useState(
  typeof Notification==='undefined'?'unsupported':Notification.permission);
 const baseline=useRef<Map<string,number>|null>(null);
 const inFlight=useRef(false);
 const fresh=useCallback(async()=>{
  if(!enabled||inFlight.current||!navigator.onLine)return;
  inFlight.current=true;
  try{
   const response=await fetch('/api/quote-inbox',{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw Error('No se pudo consultar la bandeja.');
   const data=await response.json() as ResponseData;
   if(!Array.isArray(data.conversations))throw Error('Respuesta inválida.');
   const previous=baseline.current;
   const latest=new Map(data.conversations.map(c=>[c.quoteId,c.cursor]));
   if(previous){
    for(const c of data.conversations){
     if(c.sender!=='client'||c.unread===0)continue;
     const seen=previous.get(c.quoteId);
     if(seen!==undefined&&c.cursor<=seen)continue;
     const message=c.kind==='audio'?'Nueva nota de voz':c.text.slice(0,110);
     window.dispatchEvent(new CustomEvent('hn-quotes-incoming-message',{detail:{
       quoteId:c.quoteId,title:c.title,kind:c.kind,text:message
     }}));
     if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
      try{
       const reg=await navigator.serviceWorker?.getRegistration();
       if(reg)void reg.showNotification('HAVANA NICE · '+c.title,{
        body:message,tag:'hn-quote-chat-'+c.quoteId,
        data:{quoteId:c.quoteId,url:'/'}
       }).catch(()=>{});
      }catch{/* Badges and inbox remain available. */}
     }
    }
   }
   baseline.current=latest;
   setConversations(data.conversations);
   setUnreadTotal(data.unreadTotal||0);
   setError('');
  }catch{setError('Sin conexión con los mensajes. Volveremos a intentarlo.');}
  finally{inFlight.current=false;setLoading(false);}
 },[enabled]);
 useEffect(()=>{
  if(!enabled){setLoading(false);return;}
  void fresh();
  const timer=setInterval(()=>{if(!document.hidden)void fresh();},POLL_MS);
  const resume=()=>{if(!document.hidden)void fresh();};
  const online=()=>void fresh();
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('online',online);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',resume);
   window.removeEventListener('online',online);};
 },[enabled,fresh]);
 const askNotifications=async()=>{
  if(typeof Notification==='undefined')return;
  try{setPermission(await Notification.requestPermission());}
  catch{setPermission(Notification.permission);}
 };
 return {conversations,unreadTotal,loading,error,refresh:fresh,permission,askNotifications};
}
