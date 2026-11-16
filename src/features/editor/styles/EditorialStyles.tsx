import { Check, ChevronRight, ChevronDown } from 'lucide-react';
import { TEMPLATE_REGISTRY, TEMPLATE_IDS } from '../../templates/template-registry';
import './editorial-styles.css';

export const editorialStyles=TEMPLATE_IDS.map(id=>({id,name:TEMPLATE_REGISTRY[id].name}));

type Props = {
  value: string;
  onChange: (style: string) => void;
  photo: string;
};

type StyleOption = (typeof editorialStyles)[number];
function StyleCard({s, value, onChange, photo}: {s: StyleOption; value: string; onChange: (id: string)=>void; photo: string}) {
  return (
          <button key={s.id} type="button" aria-pressed={s.id === value}
            className={'hn-style-card hn-card-'+s.id+(value===s.id?' selected':'')}
            onClick={()=>onChange(s.id)}>
            <div className={'hn-style-mini hn-mini-'+s.id}>
              {s.id==='carolina' ? (
                <>
                  {photo && <div className="hn-mini-photo" style={{backgroundImage:'url('+photo+')'}}/>}
                  <strong>HAVANA NICE</strong>
                  <em>Live Wedding Music</em>
                  <div className="hn-mini-carolina-bottom"><span/><span/><span/><span/></div>
                </>
              ) : s.id==='libre' ? (
                <><div className="hn-mini-square"/><strong>YOUR<br/>STORY.</strong><small>A PERSONAL VISION</small></>
              ) : s.id==='nyt' ? (
                <><div className="hn-mini-double-rule"/><small>THE PRIVATE WEDDING EDITION</small><strong>A Celebration<br/>in Mexico</strong>{photo && <div className="hn-mini-photo newspaper" style={{backgroundImage:'url('+photo+')'}}/>}<p>LOVE · MUSIC · THE PEOPLE WHO MATTER</p></>
              ) : (
                <>{photo && <div className="hn-mini-photo" style={{backgroundImage:'url('+photo+')'}}/>}
                  {s.id==='vogue' ? <><strong>THE<br/>EDIT.</strong><small>AN EXCLUSIVE WEDDING STORY</small><em>YOUR CELEBRATION</em></> :
                   s.id==='lane' ? <><small>THE PRIVATE EDITION</small><strong>Art of<br/><em>celebration.</em></strong><span>HAVANA NICE / MEXICO</span></> :
                   <><small>WEDDING STORIES</small><strong>Joy, love<br/><em>& live music.</em></strong><span>THE EDITORIAL JOURNAL</span></>}
                </>
              )}
            </div>
            <div className="hn-card-caption">
              <strong>{s.name}{s.id===value?<Check size={16}/>:<ChevronRight size={15}/>}</strong>
            </div>
          </button>
  );
}
/** Two independent collapsible template groups. */
export default function EditorialStyles({value, onChange, photo}: Props) {
  return (
    <div className="hn-styles-tab">
      <details className="hn-style-accordion" open>
        <summary><span>Plantillas originales</span><ChevronDown size={19}/></summary>
        <div className="hn-style-accordion-content">
          <div className="hn-styles-gallery hn-styles-original">
            {editorialStyles.filter(s => s.id === 'carolina').map(s => (
              <StyleCard key={s.id} s={s} value={value} onChange={onChange} photo={photo}/>
            ))}
          </div>
        </div>
      </details>
      <details className="hn-style-accordion">
        <summary><span>Estilos editoriales especiales</span><ChevronDown size={19}/></summary>
        <div className="hn-style-accordion-content">
          <div className="hn-styles-gallery">
            {editorialStyles.filter(s => s.id !== 'carolina').map(s => (
              <StyleCard key={s.id} s={s} value={value} onChange={onChange} photo={photo}/>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
