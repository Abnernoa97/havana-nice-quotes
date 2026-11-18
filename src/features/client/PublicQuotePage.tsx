import {useEffect,useRef,useState} from 'react';
import type {Quote,ReadingMode} from '../quotes/types';
import Proposal from './Proposal';
import FlipMagazine from '../magazine/FlipMagazine';
import './public-quote.css';

type PublicPayload={quote:Quote;revision:number;expiresAt:number|null};
type Props={token:string};
export default function PublicQuotePage({token}:Props){
 const [payload,setPayload]=useState<PublicPayload|null>(null);
 const [mode,setMode]=useState<ReadingMode>('flip');
 const [userChoseMode,setUserChoseMode]=useState(false);
 const [error,setError]=useState('');
 const [initialLoading,setInitialLoading]=useState(true);
 const visited=useRef(false);
 const visitId=useRef(crypto.randomUUID());
 useEffect(()=>{
  let alive=true;
  const read=async()=>{
   if(document.hidden)return;
   try{
    const response=await fetch('/api/shared/'+token,{cache:'no-store',
     credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error('This proposal link is unavailable or has expired.');
    const data=await response.json() as PublicPayload;
    if(!data?.quote?.id)throw Error('This proposal could not be loaded.');
    if(!alive)return;
    setPayload(prev=>prev?.revision===data.revision?prev:data);
    if(!userChoseMode)setMode(data.quote.readingMode==='scroll'?'scroll':'flip');
    setError('');
   }catch(cause){
    if(alive){setError(cause instanceof Error?cause.message:'Unable to open this proposal.');setPayload(null);}
   }finally{if(alive)setInitialLoading(false);}
  };
  void read();
  const interval=setInterval(()=>void read(),30000);
  const visible=()=>{if(!document.hidden)void read();};
  document.addEventListener('visibilitychange',visible);
  return ()=>{alive=false;clearInterval(interval);document.removeEventListener('visibilitychange',visible);};
 },[token,userChoseMode]);
 useEffect(()=>{
  if(!payload?.quote?.id||visited.current)return;
  visited.current=true;
  // Random browser identity, not phone number, email, IP or personal tracking.
  let visitorId:string=crypto.randomUUID();
  try{
   const old=window.localStorage.getItem('hn-quotes-visitor-v1');
   if(old&&/^[a-f0-9-]{36}$/.test(old))visitorId=old;
   else window.localStorage.setItem('hn-quotes-visitor-v1',visitorId);
  }catch{/* Private browsing: count visit without persistent device identity. */}
  void fetch('/api/shared/'+token+'/visit',{
   method:'POST',credentials:'omit',cache:'no-store',keepalive:true,
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({visitorId,visitId:visitId.current})
  }).catch(()=>{});
 },[payload?.quote?.id,token]);
 useEffect(()=>{
  document.title=payload?.quote?.name
   ?'HAVANA NICE · '+payload.quote.name:'HAVANA NICE · Private proposal';
 },[payload?.quote?.name]);
 if(initialLoading)return <div className="hn-public-loading" role="status">Opening your proposal…</div>;
 if(error||!payload)return <div className="hn-public-error" role="alert">
  <h1>HAVANA NICE</h1><p>{error||'This proposal is not available.'}</p></div>;
 const item=payload.quote;
 const styleName=item.style||'libre';
 return <div className="hn-public-proposal">
  <header className="hn-public-head">
   <button type="button" className={mode==='flip'?'active':''}
    aria-pressed={mode==='flip'} onClick={()=>{setUserChoseMode(true);setMode('flip');}}>3D Magazine</button>
   <button type="button" className={mode==='scroll'?'active':''}
    aria-pressed={mode==='scroll'} onClick={()=>{setUserChoseMode(true);setMode('scroll');}}>Scroll</button>
  </header>
  <main className={'hn-public-document hn-style-'+styleName}>
   {mode==='flip'?<FlipMagazine item={item} clientView/>:
    <Proposal item={item} styleName={styleName}/>}
  </main>
 </div>;
}
