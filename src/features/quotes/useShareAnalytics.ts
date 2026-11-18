import {useEffect,useState} from 'react';

export type ShareCounts={shares:number;opens:number;devices:number};
export type ShareSummary=Record<string,ShareCounts>;
/** Owner-only aggregate counts, polled on the quotations list, never on client pages. */
export function useShareAnalytics(active:boolean){
 const [counts,setCounts]=useState<ShareSummary>({});
 useEffect(()=>{
  if(!active)return;
  let alive=true;
  const refresh=async()=>{
   if(document.hidden)return;
   try{
    const result=await fetch('/api/share-analytics',{cache:'no-store',credentials:'same-origin'});
    if(!result.ok)return;
    const data=await result.json() as {quotes:ShareSummary};
    if(alive&&data.quotes)setCounts(data.quotes);
   }catch{/* Keep the last grounded totals while offline. */}
  };
  void refresh();
  const timer=setInterval(()=>void refresh(),15000);
  const visible=()=>{if(!document.hidden)void refresh();};
  document.addEventListener('visibilitychange',visible);
  return ()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[active]);
 return counts;
}
