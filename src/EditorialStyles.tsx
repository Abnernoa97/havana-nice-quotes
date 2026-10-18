// @ts-nocheck
import { Check, ChevronRight, BookOpen, AlignJustify, Palette, Eye } from 'lucide-react';
import './editorial-styles.css';

export const editorialStyles = [
  {id:'libre',name:'Estilo libre',category:'TU PROPIO LENGUAJE',desc:'Una composición abierta para crear tu propio lenguaje visual.',features:'Personalizable · HAVANA NICE'},
  {id:'vogue',name:'Vogue',category:'FASHION EDITORIAL',desc:'Grandes títulos, fotografías dominantes y alto contraste editorial.',features:'Bodoni · Contraste · Moda'},
  {id:'lane',name:'The Lane',category:'MODERN LUXURY',desc:'Arquitectura, fotografía delicada, aire y composiciones asimétricas.',features:'Cormorant · Marfil · Espacio'},
  {id:'junebug',name:'Junebug Weddings',category:'WEDDING STORIES',desc:'Narrativa fotográfica espontánea con detalles y carácter cálido.',features:'Fraunces · Terracota · Collage'},
  {id:'nyt',name:'The New York Times',category:'NEWSPAPER EDITORIAL',desc:'Historias, columnas y titulares con la estructura de un periódico.',features:'Georgia · Tinta · Líneas'},
];

export default function EditorialStyles({value, onChange, readingMode, onReadingChange, onEditFree, onPreview, photo}) {
  return (
    <div className="hn-styles-tab">
      <span className="eyebrow">HAVANA NICE / EDITORIAL LIBRARY</span>
      <h3>Una propuesta. Muchos lenguajes.</h3>
      <p className="hn-styles-lead">Elige cómo se cuenta la historia. Cada estilo cambia la dirección visual, no los nombres, fotografías, textos ni precios.</p>
      <div className="hn-styles-gallery">
        {editorialStyles.map(s => (
          <button key={s.id} type="button" aria-pressed={s.id === value}
            className={'hn-style-card hn-card-'+s.id+(value===s.id?' selected':'')}
            onClick={()=>onChange(s.id)}>
            <div className={'hn-style-mini hn-mini-'+s.id}>
              {s.id==='libre' ? (
                <><div className="hn-mini-square"/><strong>YOUR<br/>STORY.</strong><small>A PERSONAL VISION</small></>
              ) : s.id==='nyt' ? (
                <><div className="hn-mini-double-rule"/><small>THE PRIVATE WEDDING EDITION</small><strong>A Celebration<br/>in Mexico</strong><div className="hn-mini-photo newspaper" style={{backgroundImage:'url('+photo+')'}}/><p>LOVE · MUSIC · THE PEOPLE WHO MATTER</p></>
              ) : (
                <><div className="hn-mini-photo" style={{backgroundImage:'url('+photo+')'}}/>
                  {s.id==='vogue' ? <><strong>THE<br/>EDIT.</strong><small>AN EXCLUSIVE WEDDING STORY</small><em>OLIVIA & JAMES</em></> :
                   s.id==='lane' ? <><small>THE PRIVATE EDITION</small><strong>Art of<br/><em>celebration.</em></strong><span>HAVANA NICE / MEXICO</span></> :
                   <><small>WEDDING STORIES</small><strong>Joy, love<br/><em>& live music.</em></strong><span>THE EDITORIAL JOURNAL</span></>}
                </>
              )}
            </div>
            <div className="hn-card-caption">
              <span className="hn-card-kind">{s.category}</span>
              <strong>{s.name}{s.id===value?<Check size={16}/>:<ChevronRight size={15}/>}</strong>
              <p>{s.desc}</p><small>{s.features}</small>
            </div>
          </button>
        ))}
      </div>
      <p className="hn-style-attribution">Estilos originales de HAVANA NICE inspirados en lenguajes editoriales. No representan diseños oficiales ni afiliación con las publicaciones.</p>
      <div className="hn-style-customize">
        <span className="eyebrow">LIBERTAD CREATIVA</span>
        <h4>El estilo es un punto de partida.</h4>
        <p>Personaliza la portada, la tipografía y los colores. Los datos de la cotización permanecen intactos al cambiar de estilo.</p>
        <button type="button" onClick={onEditFree}><Palette size={17}/> Editar diseño <ChevronRight size={16}/></button>
      </div>
      <div className="hn-style-reading">
        <span className="eyebrow">MODO DE LECTURA · ESTA COTIZACIÓN</span>
        <h4>¿Cómo la verá el cliente?</h4>
        <div className="hn-style-reading-buttons">
          <button className={readingMode==='flip'?'on':''} onClick={()=>onReadingChange('flip')}><BookOpen size={17}/> Revista 3D</button>
          <button className={readingMode==='scroll'?'on':''} onClick={()=>onReadingChange('scroll')}><AlignJustify size={17}/> Scroll</button>
        </div>
        <button className="hn-style-open-preview" onClick={onPreview}><Eye size={17}/> Probar vista del cliente <ChevronRight size={17}/></button>
      </div>
    </div>
  );
}
