import { useEffect, useState } from 'react';
import { Check, ChevronRight, CircleDot, Crop, Droplets, Layers3, Palette, RefreshCw } from 'lucide-react';
import type { CarolinaPhotoStyle } from '../../templates/carolina-layout';
import { CAROLINA_PHOTO_DEFAULTS as D } from '../../templates/carolina-layout';
import './photo-style-dock.css';

type Tool = 'background'|'color'|'crop'|'opacity'|'replace'|'vignette';
type NumberKey = Exclude<keyof CarolinaPhotoStyle,
  'behindText'|'tint'|'vignetteShape'|'vignetteColor'|'cropAspect'>;
type Props = {
  photoId:string; style?:CarolinaPhotoStyle;
  onStyleChange:(patch:Partial<CarolinaPhotoStyle>)=>void;
  onReplace:()=>void;
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
  photoId,style,onStyleChange,onReplace,onToolChange,
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
  return <aside className="hn-text-dock hn-photo-dock" role="group" aria-label="Editar imagen seleccionada">
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
      {tab==='crop' && <div className="hn-photo-controls hn-photo-crop-controls">
        <div className="hn-photo-crop-aspect-title">Aspecto</div>
        <div className="hn-photo-crop-aspects" role="group" aria-label="Proporciones de recorte">
          {([
            {id:'frame',label:'Recuadro'}, {id:'1:1',label:'1:1'},
            {id:'4:5',label:'4:5'}, {id:'9:16',label:'9:16'}, {id:'16:9',label:'16:9'},
          ] as const).map(option=><button key={option.id} type="button"
            className={(style?.cropAspect||'frame')===option.id?'chosen':''}
            aria-pressed={(style?.cropAspect||'frame')===option.id}
            onClick={()=>onStyleChange({cropAspect:option.id})}>{option.label}</button>)}
        </div>
        {slider('Zoom','cropZoom',100,300)}
        {slider('Girar izquierda / derecha','cropRotation',-180,180,'°')}
        <div className="hn-photo-crop-turn" role="group" aria-label="Giro rápido">
          <button type="button" onClick={()=>onStyleChange({cropRotation:Math.max(-180,(style?.cropRotation??0)-90)})}>↶ 90°</button>
          <button type="button" onClick={()=>onStyleChange({cropRotation:0})}>0°</button>
          <button type="button" onClick={()=>onStyleChange({cropRotation:Math.min(180,(style?.cropRotation??0)+90)})}>90° ↷</button>
        </div>
        <div className="hn-photo-crop-footer">
          <small>Mueve con un dedo · Pellizca y gira con dos · Ajusta desde las esquinas</small>
          <button className="hn-photo-reset" type="button" onClick={()=>onStyleChange({
            cropZoom:100,cropX:50,cropY:50,cropRotation:0,cropAspect:'frame'
          })}>Restablecer</button>
        </div>
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
        <small>Mueve la viñeta con un dedo sobre la fotografía de arriba.</small>
      </div>}
    </div>}
    <div className="hn-photo-tools-rail">
      <div className="hn-text-dock-switches hn-photo-switches" role="group"
        aria-label="Herramientas de fotografía. Desliza horizontalmente para ver más">
        {tools.map(({id,label,Icon})=><button type="button" key={id}
          className={tab===id?'active':''} aria-pressed={tab===id}
          onClick={()=>toggle(id)}><Icon size={16} strokeWidth={1.8}/><span>{label}</span></button>)}
      </div>
      <span className="hn-photo-rail-more" aria-hidden="true"><ChevronRight size={16}/></span>
    </div>
  </aside>;
}
