import {useEffect,useState} from 'react';
import {FileText,Send, X} from 'lucide-react';
import type {Quote} from '../quotes/types';
import './quote-save-dialog.css';

type SaveState='Borrador'|'Lista para enviar';
type Props={
 item:Quote;
 busy:boolean;
 onClose:()=>void;
 onSave:(title:string,status:SaveState)=>void;
};
/** Choose the document name explicitly; no quotation is created until saved. */
export default function QuoteSaveDialog({item,busy,onClose,onSave}:Props){
 const [title,setTitle]=useState(item.quoteTitle||'');
 const [error,setError]=useState('');
 useEffect(()=>setTitle(item.quoteTitle||''),[item.id]);
 const save=(status:SaveState)=>{
  const name=title.trim();
  if(!name){setError('Escribe el nombre de esta cotización.');return;}
  if(name.length>150){setError('Máximo 150 caracteres.');return;}
  onSave(name,status);
 };
 return <div className="hn-save-backdrop" role="presentation" onPointerDown={e=>{
   if(e.target===e.currentTarget&&!busy)onClose();
 }}>
  <section className="hn-save-dialog" role="dialog" aria-modal="true"
    aria-label="Guardar cotización" aria-labelledby="hn-save-heading">
   <header>
    <div><small>HAVANA NICE · COTIZACIONES</small><h2 id="hn-save-heading">Guardar cotización</h2></div>
    <button type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={21}/></button>
   </header>
   <label htmlFor="hn-quote-file-name">Nombre de la cotización</label>
   <input id="hn-quote-file-name" type="text" value={title} autoFocus
     maxLength={150} placeholder="Cotización para Ella y Él · Mayo 2027"
     onChange={e=>{setTitle(e.target.value);setError('');}}
     onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();save('Borrador');}}}/>
   <p className="hn-save-hint">Así aparecerá en Cotizaciones y se identificará la propuesta al compartirla. No cambia los nombres de la pareja dentro del diseño.</p>
   {error&&<p className="hn-save-error" role="alert">{error}</p>}
   <div className="hn-save-options">
    <button type="button" disabled={busy} className="hn-save-draft" onClick={()=>save('Borrador')}>
     <FileText size={20}/><span><strong>Guardar como borrador</strong><small>Para continuar editándola después</small></span>
    </button>
    <button type="button" disabled={busy} className="hn-save-ready" onClick={()=>save('Lista para enviar')}>
     <Send size={20}/><span><strong>Guardar y enviar</strong><small>Dejar en Listas para enviar</small></span>
    </button>
   </div>
   <p className="hn-save-note">«Guardar y enviar» prepara la cotización para el envío. No la envía al cliente automáticamente.</p>
  </section>
 </div>;
}
