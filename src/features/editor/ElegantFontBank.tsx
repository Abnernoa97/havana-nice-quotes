import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { ELEGANT_FONTS, ELEGANT_FONT_GROUPS, elegantFontFamily, loadElegantFont } from '../templates/elegant-fonts';
import type { ElegantFontGroup, ElegantFontId } from '../templates/elegant-fonts';
import './elegant-font-bank.css';

type Props = {
  targetName: string;
  activeFont?: ElegantFontId;
  onChoose: (font: ElegantFontId | null) => void;
  onClose: () => void;
};
/** Real-family previews. Font faces are loaded only for the visible category/search. */
export default function ElegantFontBank({targetName,activeFont,onChoose,onClose}: Props) {
  const [group,setGroup]=useState<ElegantFontGroup | 'todo'>('editorial');
  const [search,setSearch]=useState('');
  const visible=useMemo(() => {
    const q=search.trim().toLocaleLowerCase('es');
    return ELEGANT_FONTS.filter(font =>
      (Boolean(q) || group==='todo' || font.group===group) &&
      (!q || font.name.toLocaleLowerCase('es').includes(q)));
  },[group,search]);
  useEffect(() => { for (const font of visible) loadElegantFont(font.id); },[visible]);
  return (
    <div className="hn-font-shade" onPointerDown={event => {
      if (event.target===event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-label="Banco de tipografías elegantes"
        className="hn-font-bank">
        <header className="hn-font-bank-head">
          <div>
            <small>HAVANA NICE · DISEÑO</small>
            <h3>Tipografías</h3>
            <p>Aplicar a: <strong>{targetName}</strong></p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar tipografías"><X size={21}/></button>
        </header>
        <label className="hn-font-search">
          <Search size={18}/>
          <input type="search" value={search} autoFocus
            onChange={event=>setSearch(event.target.value)}
            placeholder="Buscar una tipografía…" aria-label="Buscar tipografía"/>
        </label>
        <div className="hn-font-groups" role="group" aria-label="Categorías de tipografías">
          <button type="button" className={group==='todo'?'active':''}
            onClick={()=>setGroup('todo')}>Todas</button>
          {ELEGANT_FONT_GROUPS.map(category=>
            <button type="button" key={category.id}
              className={group===category.id?'active':''}
              onClick={()=>setGroup(category.id)}>{category.label}</button>)}
        </div>
        <div className="hn-font-gallery">
          {visible.map(font=>
            <button key={font.id} type="button" className={'hn-font-option' +
              (activeFont===font.id?' selected':'')}
              aria-pressed={activeFont===font.id} onClick={()=>onChoose(font.id)}>
              <span className="hn-font-example" style={{fontFamily:elegantFontFamily(font.id)}}>
                Havana Nice
              </span>
              <span className="hn-font-label">
                <span>{font.name}</span>
                {activeFont===font.id && <Check size={17} aria-hidden="true"/>}
              </span>
            </button>)}
          {!visible.length && <p className="hn-font-empty">No encontramos esa tipografía.</p>}
        </div>
        <footer className="hn-font-bank-footer">
          <button type="button" onClick={()=>onChoose(null)}>Restaurar tipografía original</button>
          <span>{ELEGANT_FONTS.length} familias disponibles</span>
        </footer>
      </section>
    </div>
  );
}
