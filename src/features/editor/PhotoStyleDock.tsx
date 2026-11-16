import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import { Check, CircleDot, Crop, Droplets, Layers3, Palette, RefreshCw, X } from 'lucide-react';
import type { CarolinaPhotoStyle } from '../templates/carolina-layout';
import { CAROLINA_PHOTO_DEFAULTS as D } from '../templates/carolina-layout';
import './photo-style-dock.css';

type Tool = 'background'|'color'|'crop'|'opacity'|'replace'|'vignette';
type NumberKey = Exclude<keyof CarolinaPhotoStyle,
  'behindText'|'tint'|'vignetteShape'|'vignetteColor'>;
type Props = {
  photoId:string; url:string; style?:CarolinaPhotoStyle;
  onStyleChange:(patch:Partial<CarolinaPhotoStyle>)=>void;
  onReplace:()=>void; onClose:()=>void;
  onToolChange:(value:'crop'|'vignette'|null)=>void;
};
const tools=[
  {id:'background',label:'Fondo',Icon:Layers3},
  {id:'color',label:'Colorizar',Icon:Palette},
  {id:'crop',label:'Recortar',Icon:Crop},
  {id:'opacity',label:'Opacidad',Icon:Droplets},
  {id:'replace',label:'Reemplazar',Icon:RefreshCw},
  {id:'vignette',label:'Viñeta',Icon:CircleDot},
] as const;

function Slider({label,name,value,min,max,unit='%',onChange}:{
  label:string;name:NumberKey;value:number;min:number;max:number;
  unit?:string;onChange:Props['onStyleChange'];
}){
  return <label className="hn-photo-slider">
    <span><span>{label}</span><strong>{value}{unit}</strong></span>
    <input type="range" min={min} max={max} step="1" value={value}
      aria-label={label}
      onChange={event=>onChange({[name]:Number(event.currentTarget.value)} as Partial<CarolinaPhotoStyle>)}/>
  </label>;
}

/** One contextual dock for one image: never creates a second photo actions bar. */
export default function PhotoStyleDock({
  photoId,url,style,onStyleChange,onReplace,onClose,onToolChange,
}:Props){
  const [tab,setTab]=useState<Tool|null>(null);
  useEffect(()=>{setTab(null);onToolChange(null);},[photoId]);
  const toggle=(id:Tool)=>{
    if(id==='replace'){onToolChange(null);onReplace();return;}
    const next=tab===id?null:id;
    setTab(next);
    onToolChange(next==='crop'||next==='vignette'?next:null);
  };
  const amount=(key:Exclude<NumberKey,'tintAmount'>)=>style?.[key] ?? D[key];
  const slider=(label:string,key:Exclude<NumberKey,'tintAmount'>,min:number,max:number,unit='%')=>
    <Slider key={key} label={label} name={key} min={min} max={max} unit={unit}
      value={amount(key)} onChange={onStyleChange}/>;
  const point=(event:PointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,Math.round((event.clientX-rect.left)/rect.width*100)));
    const y=Math.max(0,Math.min(100,Math.round((event.clientY-rect.top)/rect.height*100)));
    if(tab==='crop') onStyleChange({cropX:x,cropY:y});
    else if(tab==='vignette') onStyleChange({vignetteX:x,vignetteY:y});
  };
  const dragPreview=(tab==='crop'||tab==='vignette') && <div
    className="hn-photo-touch-preview" role="group" tabIndex={0}
    aria-label={tab==='crop'?'Desliza para ajustar el encuadre':'Desliza para mover el centro de la viñeta'}
    style={url?{backgroundImage:'url("'+url+'")'}:undefined}
    onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);point(event);}}
    onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))point(event);}}
    onPointerUp={event=>event.currentTarget.releasePointerCapture(event.pointerId)}
    onKeyDown={event=>{
      const x=tab==='crop'?amount('cropX'):amount('vignetteX');
      const y=tab==='crop'?amount('cropY'):amount('vignetteY');
      const key=event.key;
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key))return;
      event.preventDefault();
      const next={x:Math.max(0,Math.min(100,x+(key==='ArrowRight'?1:key==='ArrowLeft'?-1:0))),
        y:Math.max(0,Math.min(100,y+(key==='ArrowDown'?1:key==='ArrowUp'?-1:0)))};
      if(tab==='crop')onStyleChange({cropX:next.x,cropY:next.y});
      else onStyleChange({vignetteX:next.x,vignetteY:next.y});
    }}>
    <span style={{left:(tab==='crop'?amount('cropX'):amount('vignetteX'))+'%',
      top:(tab==='crop'?amount('cropY'):amount('vignetteY'))+'%'}} />
  </div>;
  return <aside className="hn-text-dock hn-photo-dock" role="group" aria-label="Editar imagen seleccionada">
    <div className="hn-text-dock-title">
      <span className="hn-text-dock-dot" aria-hidden="true"/>
      <strong>Editar imagen</strong>
      <span className="hn-text-dock-hint">Solo esta foto</span>
      <button type="button" aria-label="Cerrar edición de imagen"
        onClick={()=>{onToolChange(null);onClose();}}><X size={17}/></button>
    </div>
    {tab && <div className="hn-text-dock-expanded hn-photo-expanded">
      {tab==='background' && <div className="hn-photo-option">
        <button type="button" className={style?.behindText?'chosen':''}
          aria-pressed={!!style?.behindText}
          onClick={()=>onStyleChange({behindText:!style?.behindText})}>
          {style?.behindText?<Check size={16}/>:<Layers3 size={16}/>}
          {style?.behindText?'Detrás de las letras':'Colocar detrás de las letras'}
        </button>
        <small>La fotografía queda bajo los textos de esta hoja.</small>
      </div>}
      {tab==='color' && <div className="hn-photo-controls">
        {slider('Brillo','brightness',0,200)}
        {slider('Contraste','contrast',0,200)}
        {slider('Saturación','saturate',0,200)}
        {slider('Tono','hue',-180,180,'°')}
        {slider('Blanco y negro','grayscale',0,100)}
        {slider('Sepia','sepia',0,100)}
        <label className="hn-photo-tint">Matiz personalizado
          <input type="color" value={style?.tint||'#244A37'}
            onChange={event=>onStyleChange({tint:event.currentTarget.value.toUpperCase(),
              tintAmount:style?.tintAmount ?? 30})}/>
        </label>
        <Slider label="Intensidad del matiz" name="tintAmount" value={style?.tintAmount??0}
          min={0} max={100} onChange={onStyleChange}/>
        <button type="button" className="hn-photo-reset" onClick={()=>onStyleChange({
          brightness:100,contrast:100,saturate:100,hue:0,grayscale:0,sepia:0,tintAmount:0
        })}>Restablecer colores</button>
      </div>}
      {tab==='crop' && <div className="hn-photo-controls">
        {slider('Zoom de la foto','cropZoom',100,300)}
        {slider('Encuadre horizontal','cropX',0,100)}
        {slider('Encuadre vertical','cropY',0,100)}
        {dragPreview}
        <small>Desliza sobre la foto o el recuadro para ajustar el encuadre.</small>
        <button className="hn-photo-reset" type="button" onClick={()=>onStyleChange({
          cropZoom:100,cropX:50,cropY:50
        })}>Restablecer recorte</button>
      </div>}
      {tab==='opacity' && <div className="hn-photo-controls">
        {slider('Opacidad de la imagen','opacity',0,100)}
        <div className="hn-photo-presets">
          {[0,25,50,75,100].map(value=><button type="button" key={value}
            className={amount('opacity')===value?'chosen':''}
            onClick={()=>onStyleChange({opacity:value})}>{value}%</button>)}
        </div>
      </div>}
      {tab==='vignette' && <div className="hn-photo-controls">
        <div className="hn-photo-options" role="group" aria-label="Forma de viñeta">
          {([{id:'none',label:'Ninguna'},{id:'square',label:'Cuadrada'},
            {id:'round',label:'Redonda'}] as const).map(x=><button type="button" key={x.id}
            className={(style?.vignetteShape||'none')===x.id?'chosen':''}
            aria-pressed={(style?.vignetteShape||'none')===x.id}
            onClick={()=>onStyleChange({vignetteShape:x.id})}>{x.label}</button>)}
        </div>
        <div className="hn-photo-options" role="group" aria-label="Color de viñeta">
          {(['black','white'] as const).map(color=><button type="button" key={color}
            className={(style?.vignetteColor||'black')===color?'chosen':''}
            aria-pressed={(style?.vignetteColor||'black')===color}
            onClick={()=>onStyleChange({vignetteColor:color,vignetteShape:style?.vignetteShape==='none'?'round':style?.vignetteShape||'round'})}>
            {color==='black'?'Negra':'Blanca'}</button>)}
        </div>
        {slider('Intensidad','vignetteStrength',0,100)}
        {slider('Extensión','vignetteSize',0,100)}
        {dragPreview}
        <small>Mueve el centro de la viñeta con un dedo sobre la foto.</small>
      </div>}
    </div>}
    <div className="hn-text-dock-switches hn-photo-switches" role="group" aria-label="Ajustes de fotografía">
      {tools.map(({id,label,Icon})=><button type="button" key={id}
        className={tab===id?'active':''} aria-pressed={tab===id}
        onClick={()=>toggle(id)}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></button>)}
    </div>
  </aside>;
}
