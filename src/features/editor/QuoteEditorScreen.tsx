import type { Dispatch, SetStateAction } from 'react';
import { Save, PenLine, BookOpen, Palette, Send } from 'lucide-react';
import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import EditorialStyles from './styles/EditorialStyles';
import QuoteDetailsPanel from './QuoteDetailsPanel';
import QuoteDesignPanel from './QuoteDesignPanel';
import type { PhotoTarget } from './shared/editor-types';
import QuotePublishPanel from './QuotePublishPanel';

type Props = {
  item: Quote;
  existingQuotes: Quote[];
  ownTemplates: Quote[];
  onCreateTemplate: () => void;
  onUseExisting: (id:string) => void;
  onUseTemplate: (id:string) => void;
  onEditOwnTemplate: (id:string) => void;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
  styleName: string;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  openClientPreview: () => void;
  save: () => void;
  cloudPhotos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<void>;
};

/** One editor: details (including investment), template, design and final review. */
export default function QuoteEditorScreen({
  item, existingQuotes, ownTemplates, onCreateTemplate, onUseExisting,
  onUseTemplate, onEditOwnTemplate, tab, setTab, styleName, edit, openClientPreview, save,
  cloudPhotos, onUploadPhoto,
}: Props) {
  return (
    <div className="page editor-page">
      <div className="editor-head">
        <div>
          <span className="eyebrow">HAVANA NICE · COTIZACIONES</span>
          <h1>{item.isTemplate ? (item.templateName?.trim() || 'Nueva plantilla') : (item.name.trim() || 'Nueva cotización')}</h1>
        </div>
        <div className="editor-actions">
          <button type="button" className="btn primary" onClick={save}>
            <Save size={16}/> Guardar
          </button>
        </div>
      </div>
      <div className="editor-workspace">
        <div className="edit-panel">
          <div className="edit-tabs hn-four-tabs" role="tablist" aria-label="Secciones del diseñador">
            <button type="button" role="tab" aria-selected={tab === 'styles'}
              className={tab === 'styles' ? 'active' : ''} onClick={() => setTab('styles')}>
              <BookOpen size={16}/> Estilos
            </button>
            <button type="button" role="tab" aria-selected={tab === 'details'}
              className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>
              <PenLine size={16}/> Datos
            </button>
            <button type="button" role="tab" aria-selected={tab === 'design'}
              className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}>
              <Palette size={16}/> Diseño
            </button>
            <button type="button" role="tab" aria-selected={tab === 'publish'}
              className={tab === 'publish' ? 'active' : ''} onClick={() => setTab('publish')}>
              <Send size={16}/> Publicar
            </button>
          </div>
          {tab === 'details' && <QuoteDetailsPanel item={item} edit={edit} />}
          {tab === 'styles' && (
            <EditorialStyles value={styleName}
              onChange={style => edit('style', style)} photo={item.cover}
              ownTemplates={ownTemplates} existingQuotes={existingQuotes}
              onCreateTemplate={onCreateTemplate} onUseExisting={onUseExisting}
              onUseTemplate={onUseTemplate} onEditOwnTemplate={onEditOwnTemplate}
              isEditingTemplate={Boolean(item.isTemplate)}
              templateName={item.templateName||''}
              onTemplateNameChange={name=>edit('templateName',name)}/>
          )}
          {tab === 'design' && (
            <QuoteDesignPanel item={item} edit={edit}
              cloudPhotos={cloudPhotos} onUploadPhoto={onUploadPhoto}/>
          )}
          {tab === 'publish' && (
            <QuotePublishPanel item={item} styleName={styleName} edit={edit}
              openClientPreview={openClientPreview}/>
          )}
        </div>
      </div>
    </div>
  );
}
