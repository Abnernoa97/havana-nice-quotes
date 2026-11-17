import { ChevronDown, Layers3, Move, Trash2 } from 'lucide-react';
import type { PhotoLayer } from './photo-layers';
import './photo-layers.css';
type Props={
  layers:PhotoLayer[];open:boolean;onToggle:()=>void;
  onEdit:(id:string)=>void;onMove:(id:string)=>void;onDelete:(id:string)=>void;
};
/** Compact recovery panel: background photos remain accessible even under text. */
export default function PhotoLayersPanel({layers,open,onToggle,onEdit,onMove,onDelete}:Props){
  if (!layers.length) return null;
  return <div className="hn-canvas-layers">
    <button type="button" className="hn-canvas-layers-trigger"
      aria-expanded={open} aria-controls="hn-photo-layers-list" onClick={onToggle}>
      <Layers3 size={16}/> Capas <strong>{layers.length}</strong>
      <ChevronDown size={15} className={open?'open':''}/>
    </button>
    {open && <div id="hn-photo-layers-list" className="hn-canvas-layers-list"
      role="group" aria-label="Editar y organizar fotografías y videos superpuestos">
      {layers.map(layer=><div className="hn-canvas-layer" key={layer.id}>
        <img src={layer.url.startsWith('/api/videos/')?layer.url+'/poster':layer.url}
          alt="" loading="lazy"/>
        <span className="hn-canvas-layer-name">{layer.label}{layer.behindText && <small> · Fondo</small>}</span>
        <button type="button" onClick={()=>onEdit(layer.id)} aria-label={'Editar '+layer.label}>Editar</button>
        <button type="button" onClick={()=>onMove(layer.id)} aria-label={'Mover '+layer.label}>
          <Move size={15}/>
        </button>
        <button type="button" onClick={()=>onDelete(layer.id)} aria-label={'Borrar '+layer.label}>
          <Trash2 size={15}/>
        </button>
      </div>)}
    </div>}
  </div>;
}
