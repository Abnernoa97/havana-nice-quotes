import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TrashItem } from './useTrash';

export type TrashFilter='all'|'quote'|'photo'|'file';
const options:{id:TrashFilter;label:string}[]=[
  {id:'all',label:'Todo'},{id:'quote',label:'Cotizaciones'},
  {id:'photo',label:'Fotos'},{id:'file',label:'Archivos'},
];
type Props={filter:TrashFilter;items:TrashItem[];onFilter:(id:TrashFilter)=>void};

/** One compact menu; choosing any category automatically folds it back up. */
export default function TrashFilterMenu({filter,items,onFilter}:Props){
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{
      if(ref.current&&!ref.current.contains(event.target as Node))setOpen(false);
    };
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',outside);
      document.removeEventListener('keydown',escape);};
  },[open]);
  const count=(id:TrashFilter)=>id==='all'?items.length:items.filter(item=>item.kind===id).length;
  const label=options.find(option=>option.id===filter)!;
  return <div ref={ref} className="hn-trash-filter-menu">
    <button type="button" className="hn-trash-filter-current"
      aria-label={'Filtrar papelera: '+label.label} aria-expanded={open}
      aria-controls="hn-trash-filter-options" onClick={()=>setOpen(v=>!v)}>
      {label.label}<span>{count(filter)}</span><ChevronDown size={15}/>
    </button>
    {open&&<div id="hn-trash-filter-options" className="hn-trash-filter-options"
      role="group" aria-label="Tipos de contenido">
      {options.map(option=><button key={option.id} type="button"
        className={filter===option.id?'active':''} aria-pressed={filter===option.id}
        onClick={()=>{onFilter(option.id);setOpen(false);}}>
        {option.label}<span>{count(option.id)}</span>
      </button>)}
    </div>}
  </div>;
}
