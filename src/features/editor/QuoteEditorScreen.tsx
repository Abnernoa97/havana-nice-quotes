import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Save, PenLine, BookOpen, Palette, Send } from 'lucide-react';
import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import EditorialStyles from './styles/EditorialStyles';
import QuoteDetailsPanel from './QuoteDetailsPanel';
import QuoteDesignPanel from './QuoteDesignPanel';
import QuotePublishPanel from './QuotePublishPanel';

type Props = {
  item: Quote;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
  styleName: string;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  openClientPreview: () => void;
  save: () => void;
  filePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  cloudPhotos: CloudPhoto[];
  onOpenBank: () => void;
};

/** One editor: details (including investment), template, design and final review. */
export default function QuoteEditorScreen({
  item, tab, setTab, styleName, edit, openClientPreview, save,
  filePicked, cloudPhotos, onOpenBank,
}: Props) {
  return (
    <div className="page editor-page">
      <div className="editor-head">
        <div>
          <span className="eyebrow">HAVANA NICE · COTIZACIONES</span>
          <h1>{item.name.trim() || 'Nueva cotización'}</h1>
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
            <button type="button" role="tab" aria-selected={tab === 'details'}
              className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>
              <PenLine size={16}/> Datos
            </button>
            <button type="button" role="tab" aria-selected={tab === 'styles'}
              className={tab === 'styles' ? 'active' : ''} onClick={() => setTab('styles')}>
              <BookOpen size={16}/> Estilos
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
              onChange={style => edit('style', style)} photo={item.cover}/>
          )}
          {tab === 'design' && (
            <QuoteDesignPanel item={item} edit={edit} filePicked={filePicked}
              cloudPhotos={cloudPhotos} onOpenBank={onOpenBank}/>
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
