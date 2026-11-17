import {useState} from 'react';
import type {ReactNode} from 'react';
import {BookOpen,ChevronLeft,FileText,Send,Wrench} from 'lucide-react';
import type {Quote,ReadingMode} from './types';
import FlipMagazine from '../magazine/FlipMagazine';
import Proposal from '../client/Proposal';
import QuoteShareDialog from './QuoteShareDialog';
import {quoteDisplayName} from './model';
import './quote-share.css';

type Props={
 item:Quote;styleName:string;mode:ReadingMode;
 onMode:(mode:ReadingMode)=>void;onBack:()=>void;onReadjust:()=>void;
 onMarkedSent:()=>Promise<boolean>;toast:string;draftScroll?:ReactNode;
};
export default function QuoteReviewPage({
 item,styleName,mode,onMode,onBack,onReadjust,onMarkedSent,toast,draftScroll
}:Props){
 const [showShare,setShowShare]=useState(false);
 const ready=['Listo para enviar','Enviada','En revisión','Aceptada'].includes(item.status)
  &&!item.isTemplate;
 return <div className="hn-review-page">
  <header className="hn-review-head">
   <div className="hn-review-actions">
    <button type="button" onClick={ready?onReadjust:onBack}>
     {ready?<Wrench size={16}/>:<ChevronLeft size={16}/>}
     {ready?'Reajustar en el editor':'Volver al diseñador'}
    </button>
    {ready&&<button className="hn-review-send" type="button"
      onClick={()=>setShowShare(true)}><Send size={16}/> Enviar al cliente</button>}
   </div>
   <div className="hn-review-switcher" role="group" aria-label="Vista de la propuesta">
    <button className={mode==='flip'?'active':''} type="button"
      aria-pressed={mode==='flip'} onClick={()=>onMode('flip')}><BookOpen size={15}/> Revista 3D</button>
    <button className={mode==='scroll'?'active':''} type="button"
      aria-pressed={mode==='scroll'} onClick={()=>onMode('scroll')}><FileText size={15}/> Scroll</button>
   </div>
  </header>
  <div className={'hn-review-reader hn-style-'+styleName}>
   {mode==='flip'?<FlipMagazine item={item} clientView={ready}/>:
     ready?<Proposal item={item} styleName={styleName}/>:draftScroll||<Proposal item={item} styleName={styleName}/>}
  </div>
  {toast&&<div className="toast">{toast}</div>}
  {showShare&&<QuoteShareDialog quoteId={item.id} quoteLabel={quoteDisplayName(item)}
    onClose={()=>setShowShare(false)} onMarkedSent={onMarkedSent}/>}
 </div>;
}
