import { useEffect } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Check } from 'lucide-react';
import type { CarolinaPhotoStyle } from '../templates/carolina-layout';
import { CAROLINA_PHOTO_DEFAULTS as D } from '../templates/carolina-layout';
import CarolinaPhotoNode from '../templates/CarolinaPhotoNode';
import PhotoStyleDock from './PhotoStyleDock';

type Tool = 'crop' | 'vignette' | null;
type Props = {
  photoId:string; url:string; pageName:string; aspect:number;
  style?:CarolinaPhotoStyle; activeTool:Tool;
  onStyleChange:(patch:Partial<CarolinaPhotoStyle>)=>void;
  onReplace:()=>void; onToolChange:(tool:Tool)=>void; onClose:()=>void;
};

/** Immersive editor: the image occupies its own viewport, never underneath a floating panel.
 * Underlying pages stay mounted so returning to the original design preserves the position. */
export default function PhotoEditingWorkspace({
  photoId,url,pageName,aspect,style,activeTool,onStyleChange,onReplace,onToolChange,onClose,
}:Props){
  useEffect(()=>{
    const prior=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const escape=(event:KeyboardEvent)=>{
      if(event.key!=='Escape')return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown',escape);
    return ()=>{
      document.body.style.overflow=prior;
      window.removeEventListener('keydown',escape);
    };
  },[photoId,onClose]);

  const point=(rect:DOMRect,x:number,y:number)=>{
    if(!rect.width||!rect.height)return;
    const px=Math.round(Math.max(0,Math.min(100,(x-rect.left)*100/rect.width)));
    const py=Math.round(Math.max(0,Math.min(100,(y-rect.top)*100/rect.height)));
    if(activeTool==='crop')onStyleChange({cropX:px,cropY:py});
    if(activeTool==='vignette')onStyleChange({vignetteX:px,vignetteY:py});
  };
  const press=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!activeTool||!url)return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    point(event.currentTarget.getBoundingClientRect(),event.clientX,event.clientY);
  };
  const drag=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!activeTool||!url||!event.currentTarget.hasPointerCapture(event.pointerId))return;
    point(event.currentTarget.getBoundingClientRect(),event.clientX,event.clientY);
  };
  const keys=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
    if(!activeTool||!url||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    const x=activeTool==='crop'?(style?.cropX??D.cropX):(style?.vignetteX??D.vignetteX);
    const y=activeTool==='crop'?(style?.cropY??D.cropY):(style?.vignetteY??D.vignetteY);
    const px=Math.max(0,Math.min(100,x+(event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0)));
    const py=Math.max(0,Math.min(100,y+(event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0)));
    if(activeTool==='crop')onStyleChange({cropX:px,cropY:py});
    else onStyleChange({vignetteX:px,vignetteY:py});
  };
  const frameStyle={'--photo-aspect':String(aspect)} as CSSProperties;
  return <section className="hn-photo-workspace" role="dialog" aria-modal="true"
    aria-label="Editor de fotografía">
    <header className="hn-photo-workspace-header">
      <div className="hn-photo-workspace-heading">
        <strong>Editar foto</strong>
        <span>{pageName} · Solo esta imagen</span>
      </div>
      <button type="button" className="hn-photo-workspace-close"
        onClick={onClose} aria-label="Finalizar edición de fotografía">
        <Check size={16}/> Listo
      </button>
    </header>
    <div className="hn-photo-workspace-stage">
      <div className={'hn-photo-workspace-frame'+(activeTool?' editing-effect':'')}
        style={frameStyle} role={activeTool?'group':'img'}
        tabIndex={activeTool?0:undefined}
        aria-label={activeTool==='crop'?'Desliza para ajustar el encuadre':
          activeTool==='vignette'?'Desliza para mover el centro de la viñeta':'Vista previa de la fotografía seleccionada'}
        onPointerDown={press} onPointerMove={drag}
        onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);}}
        onPointerCancel={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);}}
        onKeyDown={keys} onContextMenu={event=>event.preventDefault()}>
        <CarolinaPhotoNode id={photoId} url={url} photoStyle={style} cover={photoId==='photo:cover'}/>
      </div>
    </div>
    <PhotoStyleDock photoId={photoId} style={style}
      onStyleChange={onStyleChange} onReplace={onReplace} onToolChange={onToolChange}/>
  </section>;
}
