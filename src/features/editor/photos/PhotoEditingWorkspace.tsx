import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Check } from 'lucide-react';
import type { CarolinaPhotoStyle } from '../../templates/carolina-layout';
import { CAROLINA_PHOTO_DEFAULTS as D } from '../../templates/carolina-layout';
import { panCrop, pinchCrop, handleCropZoom } from '../../templates/photo-crop';
import type { CropValues } from '../../templates/photo-crop';
import CarolinaPhotoNode from '../../templates/CarolinaPhotoNode';
import PhotoStyleDock from './PhotoStyleDock';

type Tool = 'crop' | 'vignette' | null;
type Point = { x:number; y:number };
type Gesture = {start:CropValues; x:number; y:number; distance:number; corner?:string};
type Props = {
  photoId:string;url:string;pageName:string;aspect:number;style?:CarolinaPhotoStyle;activeTool:Tool;
  isPageBackground?:boolean;layersPanel?:ReactNode;
  onStyleChange:(patch:Partial<CarolinaPhotoStyle>)=>void;
  onReplace:()=>void;onToolChange:(tool:Tool)=>void;onClose:()=>void;
};
const center=(pts:Point[])=>({x:pts.reduce((n,p)=>n+p.x,0)/pts.length,y:pts.reduce((n,p)=>n+p.y,0)/pts.length});
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);

/** Lightroom-style crop: drag the underlying image, pinch to zoom and pull a corner to zoom.
 * The existing collage frame never moves or resizes; all changes persist as crop properties. */
export default function PhotoEditingWorkspace({
  photoId,url,pageName,aspect,style,activeTool,isPageBackground=false,layersPanel,onStyleChange,onReplace,onToolChange,onClose,
}:Props){
  const isVideo=url.startsWith('/api/videos/');
  const points=useRef(new Map<number,Point>());
  const gesture=useRef<Gesture|null>(null);
  const styleRef=useRef(style);
  styleRef.current=style;
  // Do not rebind body scroll locking on every slider change.
  const closeRef=useRef(onClose);
  closeRef.current=onClose;
  const crop=():CropValues=>({cropX:styleRef.current?.cropX??D.cropX,
    cropY:styleRef.current?.cropY??D.cropY,cropZoom:styleRef.current?.cropZoom??D.cropZoom});
  useEffect(()=>{
    const prior=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();closeRef.current();
    }};
    window.addEventListener('keydown',escape);
    return ()=>{document.body.style.overflow=prior;window.removeEventListener('keydown',escape);};
  },[]);
  useEffect(()=>{points.current.clear();gesture.current=null;},[activeTool,photoId]);

  const newGesture=(corner?:string)=>{
    const current=[...points.current.values()];
    if(!current.length){gesture.current=null;return;}
    const mid=center(current);
    gesture.current={start:crop(),x:mid.x,y:mid.y,
      distance:current.length>1?distance(current[0],current[1]):0,corner};
  };
  const cropPoint=(rect:DOMRect,x:number,y:number)=>{
    if(!rect.width||!rect.height)return;
    onStyleChange({vignetteX:Math.round(Math.max(0,Math.min(100,(x-rect.left)*100/rect.width))),
      vignetteY:Math.round(Math.max(0,Math.min(100,(y-rect.top)*100/rect.height)))});
  };
  const press=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!activeTool||!url)return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    points.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const handle=event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-crop-handle]')?.dataset.cropHandle
      : undefined;
    if(activeTool==='vignette'){cropPoint(event.currentTarget.getBoundingClientRect(),event.clientX,event.clientY);return;}
    newGesture(points.current.size===1?handle:undefined);
  };
  const drag=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!activeTool||!url||!points.current.has(event.pointerId))return;
    points.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const rect=event.currentTarget.getBoundingClientRect();
    if(activeTool==='vignette'){cropPoint(rect,event.clientX,event.clientY);return;}
    const g=gesture.current;
    if(!g)return;
    const positions=[...points.current.values()],mid=center(positions);
    let next:CropValues;
    if(positions.length>1) next=pinchCrop(g.start,g.distance,distance(positions[0],positions[1]));
    else if(g.corner) next=handleCropZoom(g.start,g.corner,mid.x-g.x,mid.y-g.y,rect.width,rect.height);
    else next=panCrop(g.start,mid.x-g.x,mid.y-g.y,rect.width,rect.height);
    // A pinch alters only zoom, never rotation. Rotation has its own dedicated
    // slider/90-degree controls, so a tiny thumb twist cannot tilt the photo.
    if(next.cropX!==styleRef.current?.cropX||next.cropY!==styleRef.current?.cropY||
      next.cropZoom!==styleRef.current?.cropZoom){
      styleRef.current={...styleRef.current,...next};
      onStyleChange(next);
    }
  };
  const finish=(event:ReactPointerEvent<HTMLDivElement>)=>{
    points.current.delete(event.pointerId);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    newGesture();
  };
  const keys=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
    if(!activeTool||!url||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','[',']'].includes(event.key))return;
    event.preventDefault();
    const v=crop(),dx=event.key==='ArrowRight'?5:event.key==='ArrowLeft'?-5:0;
    const dy=event.key==='ArrowDown'?5:event.key==='ArrowUp'?-5:0;
    if(activeTool==='crop')onStyleChange(event.key==='+'?{cropZoom:Math.min(300,v.cropZoom+10)}
      :event.key==='-'?{cropZoom:Math.max(100,v.cropZoom-10)}
      :event.key==='['?{cropRotation:Math.max(-180,(style?.cropRotation??0)-5)}
      :event.key===']'?{cropRotation:Math.min(180,(style?.cropRotation??0)+5)}
      :panCrop(v,dx,dy,300,300));
    else onStyleChange({vignetteX:Math.max(0,Math.min(100,(style?.vignetteX??D.vignetteX)+dx)),
      vignetteY:Math.max(0,Math.min(100,(style?.vignetteY??D.vignetteY)+dy))});
  };
  const frameStyle={'--photo-aspect':String(aspect)} as CSSProperties;
  return <section className="hn-photo-workspace" role="dialog" aria-modal="true"
    aria-label={isVideo?'Editor de video':'Editor de fotografía'}>
    <header className="hn-photo-workspace-header">
      <div className="hn-photo-workspace-heading"><strong>{isVideo?'Editar video':'Editar foto'}</strong>
        <span>{pageName} · {isPageBackground?'Fondo de página':isVideo?'Solo este video':'Solo esta imagen'}</span></div>
      <button type="button" className="hn-photo-workspace-close" onClick={onClose}
        aria-label="Finalizar edición"><Check size={16}/> Listo</button>
    </header>
    {layersPanel}
    <div className="hn-photo-workspace-stage">
      <div className={'hn-photo-workspace-frame'+(activeTool?' editing-effect':'')}
        style={frameStyle} role={activeTool?'group':'img'} tabIndex={activeTool?0:undefined}
        aria-label={activeTool==='crop'?'Mueve con un dedo; pellizca para ampliar, o usa el control de giro':
          activeTool==='vignette'?'Desliza para mover la viñeta':isVideo?'Vista previa de video':'Vista previa de fotografía'}
        onPointerDown={press} onPointerMove={drag} onPointerUp={finish} onPointerCancel={finish}
        onKeyDown={keys} onContextMenu={event=>event.preventDefault()}>
        <CarolinaPhotoNode id={photoId} url={url} photoStyle={style} cover={photoId==='photo:cover'}/>
        {activeTool==='crop'&&<div className="hn-photo-crop-guides" aria-hidden="true">
          <span className="hn-photo-crop-grid"/>
          {(['top-left','top-right','bottom-left','bottom-right'] as const).map(corner=>
            <span key={corner} data-crop-handle={corner} className={'hn-photo-crop-handle '+corner}/>)}
        </div>}
      </div>
    </div>
    <PhotoStyleDock photoId={photoId} style={style} isVideo={isVideo}
      isPageBackground={isPageBackground} onStyleChange={onStyleChange}
      onReplace={onReplace} onToolChange={onToolChange}/>
  </section>;
}
