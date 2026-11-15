import type { ChangeEvent, Dispatch, SetStateAction, CSSProperties } from 'react';
import { Eye, Save, PenLine, BookOpen, Palette, DollarSign, Monitor, Smartphone, ExternalLink } from 'lucide-react';
import EditorialStyles from './styles/EditorialStyles';
import type { Quote } from '../quotes/types';
import Proposal from '../client/Proposal';
import QuoteDetailsPanel from './QuoteDetailsPanel';
import QuoteDesignPanel from './QuoteDesignPanel';
import QuotePricingPanel from './QuotePricingPanel';

type Props = {
  item: Quote;
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
  styleName: string;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  setPreviewMode: Dispatch<SetStateAction<string>>;
  openClientPreview: () => void;
  save: () => void;
  filePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  mobilePreview: boolean;
  setMobilePreview: Dispatch<SetStateAction<boolean>>;
  share: () => void;
};

/** El mismo diseñador de la demo, extraído sin rediseñar el JSX. */
export default function QuoteEditorScreen({
  item,
  tab,
  setTab,
  styleName,
  edit,
  setPreviewMode,
  openClientPreview,
  save,
  filePicked,
  mobilePreview,
  setMobilePreview,
  share,
}: Props) {
  return (
    <div className="page editor-page">
      <div className="editor-head">
        <div>
          <div className="eyebrow">QUOTE DESIGNER / DEMO</div>
          <h1>
            {item.name || 'Tu propuesta'} <span className="italic">· estudio</span>
          </h1>
          <p className="studio-editor-subtitle">Personaliza la propuesta y revisa los cambios antes de compartirla.</p>
        </div>
        <div className="editor-actions">
          <button className="btn subtle" onClick={openClientPreview}>
            <Eye size={16} /> Vista del cliente
          </button>
          <button className="btn primary" onClick={save}>
            <Save size={16} /> Guardar
          </button>
        </div>
      </div>
      <div className="editor-workspace">
        <div className="edit-panel">
          <div className="edit-tabs hn-four-tabs">
            <button
              className={tab === 'details' ? 'active' : ''}
              onClick={() => setTab('details')}
            >
              <PenLine size={16} /> Datos
            </button>
            <button
              className={tab === 'styles' ? 'active' : ''}
              onClick={() => setTab('styles')}
            >
              <BookOpen size={16} /> Estilos
            </button>
            <button
              className={tab === 'design' ? 'active' : ''}
              onClick={() => setTab('design')}
            >
              <Palette size={16} /> Diseño
            </button>
            <button
              className={tab === 'pricing' ? 'active' : ''}
              onClick={() => setTab('pricing')}
            >
              <DollarSign size={16} /> Precios
            </button>
          </div>
          {tab === 'details' && (
            <QuoteDetailsPanel item={item} edit={edit} />
          )}
          {tab === 'styles' && (
            <EditorialStyles
              value={styleName}
              onChange={style => edit('style', style)}
              readingMode={item.readingMode === 'scroll' ? 'scroll' : 'flip'}
              onReadingChange={mode => { edit('readingMode', mode); setPreviewMode(mode); }}
              onEditFree={() => setTab('design')}
              onPreview={openClientPreview}
              photo={item.cover}
            />
          )}
          {tab === 'design' && (
            <QuoteDesignPanel item={item} edit={edit} filePicked={filePicked} />
          )}
          {tab === 'pricing' && (
            <QuotePricingPanel item={item} edit={edit} share={share} />
          )}
        </div>
        <div className="preview-side">
          <div className="preview-heading">
            <div>
              <span className="eyebrow">{item.readingMode === 'scroll' ? 'VISTA PREVIA · SCROLL' : 'VISTA PREVIA · REVISTA 3D'}</span>
              <h3>{item.readingMode === 'scroll' ? 'La propuesta de la pareja' : 'La portada de la revista'}</h3>
            </div>
            <div className="preview-switch">
              <button
                className={!mobilePreview ? 'active' : ''}
                onClick={() => setMobilePreview(false)}
                title="Vista de escritorio"
                aria-label="Vista de escritorio"
                aria-pressed={!mobilePreview}
              >
                <Monitor size={18} />
              </button>
              <button
                className={mobilePreview ? 'active' : ''}
                onClick={() => setMobilePreview(true)}
                title="Vista móvil"
                aria-label="Vista móvil"
                aria-pressed={mobilePreview}
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
          <div
            className={
              mobilePreview
                ? 'preview-viewport mobile-frame'
                : 'preview-viewport'
            }
          >
            {item.readingMode === 'scroll' ? (
              <div style={{ '--paper-accent': item.color } as CSSProperties}>
                <Proposal item={item} styleName={styleName} embedded />
              </div>
            ) : (
              <div className={'studio-magazine-preview hn-style-' + styleName} style={{ '--paper-accent': item.color } as CSSProperties}>
                <div className="studio-magazine-cover" style={{ backgroundImage: 'linear-gradient(180deg, rgba(7,19,16,.24), rgba(7,19,16,.03) 36%, rgba(7,19,16,.73)), url(' + item.cover + ')' }}>
                  <div className="studio-magazine-cover-top"><strong>HAVANA NICE</strong><span>THE PRIVATE EDITION</span></div>
                  <div className="studio-magazine-cover-bottom">
                    <span>A PRIVATE LIVE MUSIC PROPOSAL</span>
                    <h2 className={item.font === 'modern' ? 'modern' : ''}>{item.name}</h2>
                    <div className="studio-magazine-cover-rule" />
                    <p>{item.location} · {item.date ? new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'DATE TO BE CONFIRMED'}</p>
                  </div>
                  <small>ISSUE 001 · MEXICO</small>
                </div>
                <p className="studio-magazine-preview-note">Portada estática. Abre la revista para comprobar el doblez y todas las páginas.</p>
              </div>
            )}
          </div>
          <button className="preview-open" onClick={openClientPreview}>
            <ExternalLink size={16} /> Abrir vista completa de la pareja
          </button>
        </div>
      </div>
    </div>
  );
}
