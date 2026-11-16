import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, FileText, Image as ImageIcon, FolderOpen, RefreshCw, CheckSquare } from 'lucide-react';
import type { TrashItem } from './useTrash';
import TrashFilterMenu from './TrashFilterMenu';
import './trash.css';

type Filter = 'all' | 'quote' | 'photo' | 'video' | 'file';
type Props = {
  items: TrashItem[];
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  restore: (item: TrashItem) => Promise<void>;
  purge: (item: TrashItem) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  refreshPhotos: () => Promise<void>;
};
const keyOf=(item:TrashItem)=>item.kind+':'+item.id;

/** Selection stays within Papelera; only explicit confirmation can permanently purge an item. */
export default function TrashScreen({
  items,busy,error,refresh,restore,purge,refreshQuotes,refreshPhotos,
}:Props){
  const [filter,setFilter]=useState<Filter>('all');
  const [marked,setMarked]=useState<Set<string>>(()=>new Set());
  const [markedOpen,setMarkedOpen]=useState(false);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState('');
  const locked=busy||working;
  const visible=items.filter(item=>filter==='all'||item.kind===filter);
  const actionable=visible.filter(item=>item.kind!=='file');
  const selected=items.filter(item=>marked.has(keyOf(item)));
  const remaining=visible.filter(item=>!marked.has(keyOf(item)));
  const allMarked=actionable.length>0&&actionable.every(item=>marked.has(keyOf(item)));

  useEffect(()=>{
    const actual=new Set(items.map(keyOf));
    setMarked(prev=>{
      if([...prev].every(id=>actual.has(id)))return prev;
      return new Set([...prev].filter(id=>actual.has(id)));
    });
  },[items]);

  const select=(item:TrashItem,checked:boolean)=>{
    setMarked(prev=>{
      const next=new Set(prev);
      if(checked)next.add(keyOf(item));else next.delete(keyOf(item));
      return next;
    });
    if(checked)setMarkedOpen(true);
  };
  const markAll=()=>{
    setMarked(prev=>{
      const next=new Set(prev);
      for(const item of actionable){
        if(allMarked)next.delete(keyOf(item));else next.add(keyOf(item));
      }
      return next;
    });
    if(!allMarked)setMarkedOpen(true);
  };
  const restoreOne=async(item:TrashItem)=>{
    try{
      await restore(item);
      await Promise.all([refreshQuotes(),refreshPhotos()]);
      setMarked(prev=>{const next=new Set(prev);next.delete(keyOf(item));return next;});
      setMessage('Restaurado correctamente.');
    }catch{setMessage('No se pudo restaurar. Inténtalo de nuevo.');}
  };
  const purgeOne=async(item:TrashItem)=>{
    if(!window.confirm('¿Eliminar definitivamente «'+item.label+'»?\nNo podrá recuperarse.'))return;
    try{
      await purge(item);
      setMarked(prev=>{const next=new Set(prev);next.delete(keyOf(item));return next;});
      setMessage('Elemento eliminado definitivamente.');
    }catch{setMessage('No se pudo eliminar. Inténtalo de nuevo.');}
  };
  const bulk=async(kind:'restore'|'purge')=>{
    const batch=selected.filter(item=>item.kind!=='file');
    if(!batch.length||locked)return;
    if(kind==='purge'&&!window.confirm('¿Eliminar definitivamente '+batch.length+
      ' elementos seleccionados?\nEsta acción no se puede deshacer.'))return;
    setWorking(true);
    let completed=0;
    try{
      for(const item of batch){
        try{
          if(kind==='restore')await restore(item);else await purge(item);
          completed++;
          setMarked(prev=>{const next=new Set(prev);next.delete(keyOf(item));return next;});
        }catch{break;}
      }
      if(kind==='restore'&&completed)await Promise.all([refreshQuotes(),refreshPhotos()]);
      setMessage(completed===batch.length
        ? completed+' elementos '+(kind==='restore'?'restaurados.':'eliminados definitivamente.')
        : completed+' de '+batch.length+' procesados. Los demás siguen en la papelera.');
    }finally{setWorking(false);}
  };
  const row=(item:TrashItem,inside:boolean)=>(
    <article key={keyOf(item)} className={'hn-trash-row'+(inside?' in-selection':'')}>
      <label className="hn-trash-select">
        <input type="checkbox" checked={marked.has(keyOf(item))} disabled={locked||item.kind==='file'}
          onChange={event=>select(item,event.target.checked)}
          aria-label={'Marcar '+item.label}/>
      </label>
      <div className="hn-trash-thumb">
        {item.kind==='photo'&&item.url?<img src={item.url} alt=""/>:
          item.kind==='quote'?<FileText size={22}/>:<FolderOpen size={22}/>}
      </div>
      <div className="hn-trash-content">
        <strong>{item.label}</strong>
        <small>{item.kind==='photo'?'Fotografía':item.kind==='video'?'Video':item.kind==='quote'?'Cotización':'Archivo'}
          {' · '}{new Date(item.deletedAt*1000).toLocaleDateString('es-MX')}</small>
      </div>
      <div className="hn-trash-actions">
        <button type="button" disabled={locked||item.kind==='file'} onClick={()=>void restoreOne(item)}>
          <RotateCcw size={15}/> Restaurar
        </button>
        <button type="button" className="danger" disabled={locked||item.kind==='file'}
          onClick={()=>void purgeOne(item)}><Trash2 size={15}/> Eliminar</button>
      </div>
    </article>
  );
  return <main className="page hn-trash">
    <div className="intro-line">
      <div>
        <span className="eyebrow">HAVANA NICE · WORKSPACE</span>
        <h1>Papelera</h1>
        <p>Recupera tus cotizaciones y fotografías, o elimínalas para siempre.</p>
      </div>
    </div>
    <div className="hn-trash-toolbar">
      <button type="button" className="hn-trash-refresh" disabled={locked}
        onClick={()=>void refresh()}><RefreshCw size={16}/> Actualizar</button>
      <button type="button" className="hn-trash-mark-all" disabled={locked||!actionable.length}
        aria-pressed={allMarked} onClick={markAll}>
        <CheckSquare size={16}/>{allMarked?'Desmarcar todo':'Marcar todo'}
      </button>
      <TrashFilterMenu filter={filter} items={items} onFilter={setFilter}/>
    </div>
    {message&&<p className="hn-trash-message" role="status">{message}</p>}
    {error&&<p className="hn-trash-error" role="alert">{error}</p>}
    {selected.length>0&&<section className="hn-trash-selected">
      <button type="button" className="hn-trash-selected-toggle" aria-expanded={markedOpen}
        aria-controls="hn-trash-selected-rows" onClick={()=>setMarkedOpen(open=>!open)}>
        <CheckSquare size={16}/> Seleccionados ({selected.length})
        <span className={'hn-trash-chevron'+(markedOpen?' is-open':'')} aria-hidden="true">⌄</span>
      </button>
      {markedOpen&&<div id="hn-trash-selected-rows" className="hn-trash-selected-body">
        {selected.map(item=>row(item,true))}
        <div className="hn-trash-bulk-actions">
          <button type="button" disabled={locked} onClick={()=>void bulk('restore')}>
            <RotateCcw size={15}/> Restaurar seleccionados
          </button>
          <button type="button" className="danger" disabled={locked}
            onClick={()=>void bulk('purge')}><Trash2 size={15}/> Eliminar seleccionados</button>
        </div>
      </div>}
    </section>}
    {remaining.length>0?<div className="hn-trash-list">{remaining.map(item=>row(item,false))}</div>
      :!selected.length&&<div className="hn-trash-empty">
        {filter==='photo'?<ImageIcon size={35}/>:<Trash2 size={35}/>}
        <h2>{filter==='file'?'Todavía no hay archivos en la papelera.':'La papelera está vacía.'}</h2>
        <p>Los elementos que envíes aquí estarán disponibles para restaurar hasta que los elimines definitivamente.</p>
      </div>}
  </main>;
}
