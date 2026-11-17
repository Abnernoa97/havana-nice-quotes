import {useEffect,useState} from 'react';
import {Copy,Link2,RotateCcw,Send,Trash2,X} from 'lucide-react';
import './quote-share.css';
type ShareLink={url:string;expiresAt:number|null;createdAt?:number};
type Props={quoteId:string;quoteLabel:string;onClose:()=>void;onMarkedSent:()=>Promise<boolean>};
const DAY_OPTIONS=[{value:1,label:'24 horas'},{value:7,label:'7 días'},
 {value:30,label:'30 días'},{value:90,label:'90 días'},{value:0,label:'Sin vencimiento'}];

/** Only the owner can create or revoke links. "Compartir" opens WhatsApp
 * but never claims delivery until the owner explicitly marks it as sent. */
export default function QuoteShareDialog({quoteId,quoteLabel,onClose,onMarkedSent}:Props){
 const [link,setLink]=useState<ShareLink|null>(null);
 const [days,setDays]=useState(30);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [sentBusy,setSentBusy]=useState(false);
 useEffect(()=>{
  let mounted=true;
  void fetch('/api/share-links?quoteId='+encodeURIComponent(quoteId),{
   credentials:'same-origin',cache:'no-store'
  }).then(async r=>{
   if(!r.ok)throw Error('No se pudo consultar el enlace.');
   return r.json() as Promise<{link:ShareLink|null}>;
  }).then(data=>{if(mounted)setLink(data.link);})
   .catch(()=>{if(mounted)setError('No se pudo consultar el enlace.');})
   .finally(()=>{if(mounted)setLoading(false);});
  return ()=>{mounted=false;};
 },[quoteId]);
 const create=async()=>{
  if(busy)return;
  setBusy(true);setError('');
  try{
   const result=await fetch('/api/share-links',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({quoteId,days})
   });
   const data=await result.json() as {link?:ShareLink;error?:string};
   if(!result.ok||!data.link)throw Error(data.error||'No se pudo generar el enlace.');
   setLink(data.link);
  }catch(cause){setError(cause instanceof Error?cause.message:'Error de enlace.');}
  finally{setBusy(false);}
 };
 const copy=async()=>{
  if(!link)return;
  try{await navigator.clipboard.writeText(link.url);setError('Enlace copiado.');}
  catch{setError('Mantén pulsado el enlace para copiarlo.');}
 };
 const revoke=async()=>{
  if(!link||busy)return;
  if(!window.confirm('¿Desactivar este enlace para el cliente?'))return;
  setBusy(true);setError('');
  try{
   const token=new URL(link.url).pathname.split('/').pop();
   const result=await fetch('/api/share-links/'+token,{method:'DELETE',credentials:'same-origin'});
   if(!result.ok)throw Error('No se pudo desactivar el enlace.');
   setLink(null);
  }catch(cause){setError(cause instanceof Error?cause.message:'No se pudo revocar.');}
  finally{setBusy(false);}
 };
 const whatsapp=()=>{
  if(!link)return;
  const msg='Hi! Here’s your HAVANA NICE proposal: '+link.url;
  // WhatsApp opens from a real user gesture; no automatic external messages.
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');
 };
 const markedSent=async()=>{
  setSentBusy(true);
  try{if(await onMarkedSent())onClose();
   else setError('La cotización no pudo sincronizarse. Comprueba tu conexión.');}
  catch{setError('No se pudo actualizar el estado.');}
  finally{setSentBusy(false);}
 };
 const expires=link?.expiresAt
  ?new Date(link.expiresAt*1000).toLocaleDateString('es-MX',{year:'numeric',month:'short',day:'numeric'})
  :'Sin vencimiento';
 return <div className="hn-share-backdrop" role="presentation" onClick={onClose}>
  <section className="hn-share-dialog" role="dialog" aria-modal="true"
   aria-label="Enviar cotización al cliente" onClick={e=>e.stopPropagation()}>
   <div className="hn-share-heading">
    <div><span className="eyebrow">HAVANA NICE · COTIZACIONES</span>
      <h2>Enviar al cliente</h2></div>
    <button type="button" aria-label="Cerrar" onClick={onClose}><X size={21}/></button>
   </div>
   <strong className="hn-share-quote">{quoteLabel}</strong>
   {!link&&<label className="hn-share-label">Vigencia del enlace
    <select value={days} onChange={e=>setDays(Number(e.target.value))}>
     {DAY_OPTIONS.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}
    </select>
   </label>}
   {loading?<p role="status">Consultando enlace…</p>:link?<>
    <div className="hn-share-link-row"><Link2 size={17}/>
     <input readOnly aria-label="Enlace de la cotización" value={link.url}
       onFocus={e=>e.currentTarget.select()}/></div>
    <small className="hn-share-expiry">Válido hasta: {expires}</small>
    <div className="hn-share-actions">
     <button type="button" className="btn outline" onClick={()=>void copy()}><Copy size={16}/> Copiar enlace</button>
     <button type="button" className="btn primary" onClick={whatsapp}><Send size={16}/> WhatsApp</button>
    </div>
    <button type="button" className="hn-share-revoke" disabled={busy}
      onClick={()=>void revoke()}><Trash2 size={15}/> Desactivar enlace</button>
    <button type="button" className="hn-share-mark-sent" disabled={sentBusy}
      onClick={()=>void markedSent()}>{sentBusy?'Guardando…':'Ya lo envié · Marcar como enviada'}</button>
   </>:<button className="btn primary hn-share-generate" type="button"
      disabled={busy} onClick={()=>void create()}>
      <Link2 size={17}/>{busy?'Generando…':'Generar enlace privado'}
    </button>}
   {link&&<p className="hn-share-caption">Los cambios guardados en la cotización se reflejan en el mismo enlace.</p>}
   {error&&<p role="status" className="hn-share-error">{error}</p>}
  </section>
 </div>;
}
