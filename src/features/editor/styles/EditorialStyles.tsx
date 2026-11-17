import { Check, ChevronRight, ChevronDown, Plus, Copy, Pencil, Layers3 } from 'lucide-react';
import type {Quote} from '../../quotes/types';
import { TEMPLATE_REGISTRY, TEMPLATE_IDS } from '../../templates/template-registry';
import './editorial-styles.css';

export const editorialStyles=TEMPLATE_IDS.map(id=>({id,name:TEMPLATE_REGISTRY[id].name}));

type Props = {
  value: string;
  onChange: (style: string) => void;
  photo: string;
  ownTemplates: Quote[];
  existingQuotes: Quote[];
  onCreateTemplate: () => void;
  onUseExisting: (id:string) => void;
  onUseTemplate: (id:string) => void;
  onEditOwnTemplate: (id:string) => void;
  isEditingTemplate: boolean;
  templateName: string;
  onTemplateNameChange: (name:string)=>void;
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
export default function EditorialStyles({value,onChange,photo,ownTemplates,existingQuotes,
  onCreateTemplate,onUseExisting,onUseTemplate,onEditOwnTemplate,
  isEditingTemplate,templateName,onTemplateNameChange}: Props) {
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
          <div className="hn-template-actions">
            <button type="button" className="hn-create-template" onClick={onCreateTemplate}>
              <Plus size={18}/> Crear plantilla
            </button>
            <details className="hn-reuse-quotes">
              <summary><Copy size={17}/> Utilizar cotización existente <ChevronDown size={16}/></summary>
              <div className="hn-reuse-list" role="group" aria-label="Cotizaciones para copiar">
                {existingQuotes.length ? existingQuotes.map(quote=>(
                  <button type="button" key={quote.id} onClick={()=>onUseExisting(quote.id)}>
                    <strong>{quote.name?.trim()||'Cotización sin nombre'}</strong>
                    <small>{quote.location||'Sin destino'}</small>
                    <Copy size={16}/>
                  </button>
                )):<p>Todavía no hay cotizaciones para reutilizar.</p>}
              </div>
            </details>
          </div>
          {isEditingTemplate && <label className="hn-template-name">
            Nombre de esta plantilla
            <input type="text" maxLength={100} value={templateName}
              onChange={event=>onTemplateNameChange(event.target.value)}
              placeholder="Mi plantilla personalizada"/>
            <small>Personaliza sus páginas en Diseño. Se guardará como plantilla reutilizable.</small>
          </label>}
          {!!ownTemplates.length && <div className="hn-own-templates">
            <div className="hn-own-templates-heading"><Layers3 size={17}/> Mis plantillas</div>
            {ownTemplates.map(template=><div className="hn-own-template" key={template.id}>
              <div className="hn-own-template-label">
                <strong>{template.templateName||'Plantilla sin nombre'}</strong>
                <small>{TEMPLATE_REGISTRY[template.style||'libre']?.name||'Diseño propio'}</small>
              </div>
              <button type="button" onClick={()=>onEditOwnTemplate(template.id)}
                title="Editar plantilla"><Pencil size={16}/> Editar</button>
              <button type="button" className="hn-own-template-use" onClick={()=>onUseTemplate(template.id)}>
                <Copy size={16}/> Usar
              </button>
            </div>)}
          </div>}
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
