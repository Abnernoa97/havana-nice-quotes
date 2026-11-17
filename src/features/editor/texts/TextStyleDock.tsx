import { useEffect, useState } from 'react';
import { ArrowDownUp, ArrowLeftRight, Check, ChevronLeft, Palette, Type, X } from 'lucide-react';
import ElegantFontBank from './ElegantFontBank';
import type { ElegantFontId } from '../../templates/elegant-fonts';
import type { CarolinaTextStyle } from '../../templates/carolina-layout';
import './text-style-dock.css';

export type TextToolTab='fonts'|'color'|'size'|'stretchX'|'stretchY';
type Tab=TextToolTab;
type NumericKey='size'|'stretchX'|'stretchY';
type Props={
  textId:string;
  fontId?:ElegantFontId;
  style?:CarolinaTextStyle;
  onFontChange:(font:ElegantFontId|null)=>void;
  onStyleChange:(key:keyof CarolinaTextStyle,value:string|number|undefined)=>void;
  onClose:()=>void;
  onToolChange:(tool:TextToolTab|null)=>void;
};
const swatches=[
  '#FFFFFF','#161C19','#244A37','#BDA577','#D6BF93','#F5EDDC',
  '#4A584E','#25465C','#7B3E4A','#A36E49','#8D8D8D','#E5D8C5',
] as const;
const tools=[
  {id:'fonts',label:'Tipografía',Icon:Type},
  {id:'color',label:'Color',Icon:Palette},
  {id:'size',label:'Tamaño',Icon:Type},
  {id:'stretchX',label:'Ancho',Icon:ArrowLeftRight},
  {id:'stretchY',label:'Alto',Icon:ArrowDownUp},
] as const;
const controls:Record<NumericKey,{label:string;min:number;max:number;step:number}>={
  size:{label:'Tamaño de letra',min:50,max:300,step:5},
  stretchX:{label:'Expansión horizontal',min:50,max:200,step:5},
  stretchY:{label:'Expansión vertical',min:50,max:200,step:5},
};

/** Contextual formatting for ONE selected text; never modifies the page's other text. */
export default function TextStyleDock({
  textId,fontId,style,onFontChange,onStyleChange,onClose,onToolChange,
}:Props){
  const [tab,setTab]=useState<Tab|null>(null);
  useEffect(()=>setTab(null),[textId]);
  const toggle=(next:Tab|null)=>{
    const chosen=tab===next?null:next;
    setTab(chosen);
    onToolChange(chosen);
  };
  const numeric=tab==='size'||tab==='stretchX'||tab==='stretchY' ? controls[tab] : null;
  const amount=tab==='size'||tab==='stretchX'||tab==='stretchY' ? style?.[tab]??100 : 100;
  return (
    <aside className="hn-text-dock" role="group" aria-label="Herramientas del texto seleccionado">
      <div className="hn-text-dock-title">
        {tab
          ? <button type="button" aria-label="Volver a herramientas de texto"
              onClick={()=>toggle(null)}><ChevronLeft size={18}/></button>
          : <span className="hn-text-dock-dot" aria-hidden="true"/>}
        <strong>{tab?tools.find(tool=>tool.id===tab)?.label:'Editar texto'}</strong>
        {!tab && <span className="hn-text-dock-hint">Solo este elemento</span>}
        <button type="button" className="hn-text-dock-close" aria-label="Cerrar edición de texto" onClick={onClose}>
          <X size={17}/>
        </button>
      </div>
      {!tab && <div className="hn-text-dock-switches" role="group" aria-label="Ajustes del texto">
        {tools.map(({id,label,Icon})=>
          <button key={id} type="button" onClick={()=>toggle(id)}>
            <Icon size={16} strokeWidth={1.8}/>
            <span>{label}</span>
          </button>)}
      </div>}
      {tab && (
        <div className="hn-text-dock-expanded">
          {tab==='fonts' && (
            <ElegantFontBank inline targetName="Este texto"
              activeFont={fontId} resetLabel="Usar tipografía original"
              onChoose={font=>onFontChange(font)}
              onClose={()=>setTab(null)}/>
          )}
          {tab==='color' && (
            <div className="hn-text-color-panel">
              <div className="hn-text-color-swatches" role="group" aria-label="Colores de texto">
                {swatches.map(color=>
                  <button type="button" key={color}
                    aria-label={'Color '+color} aria-pressed={style?.color===color}
                    className={style?.color===color?'chosen':''}
                    style={{background:color}}
                    onClick={()=>onStyleChange('color',color)}>
                    {style?.color===color && <Check size={16}
                      color={color==='#FFFFFF'||color==='#F5EDDC'||color==='#E5D8C5'?'#244a37':'#fff'}/>}
                  </button>)}
              </div>
              <label className="hn-text-custom-color">
                <span>Color personalizado</span>
                <input type="color" aria-label="Elegir color personalizado"
                  value={style?.color||'#244A37'}
                  onChange={event=>onStyleChange('color',event.target.value.toUpperCase())}/>
              </label>
              <button type="button" className="hn-text-reset" onClick={()=>onStyleChange('color',undefined)}>
                Color original
              </button>
            </div>
          )}
          {numeric && (
            <div className="hn-text-scale-panel">
              <div className="hn-text-scale-heading">
                <label htmlFor={'hn-scale-'+textId}>{numeric.label}</label>
                <strong>{amount}%</strong>
              </div>
              <input id={'hn-scale-'+textId} type="range"
                aria-label={numeric.label}
                min={numeric.min} max={numeric.max} step={numeric.step}
                value={amount}
                onChange={event=>onStyleChange(tab as NumericKey,Number(event.target.value))}/>
              <div className="hn-text-scale-presets">
                {[75,100,125,150,200].filter(n=>n>=numeric.min&&n<=numeric.max).map(value=>
                  <button type="button" key={value}
                    className={amount===value?'active':''}
                    aria-pressed={amount===value}
                    onClick={()=>onStyleChange(tab as NumericKey,value)}>{value}%</button>)}
                <button type="button" className="reset" onClick={()=>onStyleChange(tab as NumericKey,undefined)}>
                  Original
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
