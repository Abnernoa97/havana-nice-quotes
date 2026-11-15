import { useState } from 'react';
import { Trash2, RotateCcw, FileText, Image as ImageIcon, FolderOpen, RefreshCw } from 'lucide-react';
import type { TrashItem } from './useTrash';
import './trash.css';

type Filter = 'all' | 'quote' | 'photo' | 'file';
type Props = {
  items: TrashItem[];
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  restore: (item: TrashItem) => Promise<void>;
  purge: (item: TrashItem) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  refreshPhotos: () => Promise<void>;
};

/** Only user actions permanently delete items; nothing expires automatically. */
export default function TrashScreen({
  items, busy, error, refresh, restore, purge, refreshQuotes, refreshPhotos,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [message, setMessage] = useState('');

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todo' }, { id: 'quote', label: 'Cotizaciones' },
    { id: 'photo', label: 'Fotos' }, { id: 'file', label: 'Archivos' },
  ];
  const visible = items.filter(item => filter === 'all' || item.kind === filter);
  const restoreOne = async (item: TrashItem) => {
    try {
      await restore(item);
      await Promise.all([refreshQuotes(), refreshPhotos()]);
      setMessage('Restaurado correctamente.');
    } catch { setMessage('No se pudo restaurar. Inténtalo de nuevo.'); }
  };
  const purgeOne = async (item: TrashItem) => {
    if (!window.confirm('¿Eliminar definitivamente «' + item.label +
      '»?\nNo podrá recuperarse.')) return;
    try {
      await purge(item);
      setMessage('Elemento eliminado definitivamente.');
    } catch { setMessage('No se pudo eliminar. Inténtalo de nuevo.'); }
  };
  return (
    <main className="page hn-trash">
      <div className="intro-line">
        <div>
          <span className="eyebrow">HAVANA NICE · WORKSPACE</span>
          <h1>Papelera</h1>
          <p>Recupera tus cotizaciones y fotografías, o elimínalas para siempre.</p>
        </div>
        <button type="button" className="hn-trash-refresh" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw size={17}/> Actualizar
        </button>
      </div>
      <div className="hn-trash-filters" role="group" aria-label="Contenido de la papelera">
        {tabs.map(tab => (
          <button key={tab.id} type="button" className={filter === tab.id ? 'active' : ''}
            aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>
            {tab.label}
            <span>{tab.id === 'all' ? items.length : items.filter(item => item.kind === tab.id).length}</span>
          </button>
        ))}
      </div>
      {message && <p className="hn-trash-message" role="status">{message}</p>}
      {error && <p className="hn-trash-error" role="alert">{error}</p>}
      {visible.length ? (
        <div className="hn-trash-list">
          {visible.map(item => (
            <article key={item.kind + '-' + item.id} className="hn-trash-row">
              <div className="hn-trash-thumb">
                {item.kind === 'photo' && item.url
                  ? <img src={item.url} alt=""/>
                  : item.kind === 'quote' ? <FileText size={24}/> : <FolderOpen size={24}/>}
              </div>
              <div className="hn-trash-content">
                <strong>{item.label}</strong>
                <small>{item.kind === 'photo' ? 'Fotografía' : item.kind === 'quote' ? 'Cotización' : 'Archivo'}
                  {' · '}{new Date(item.deletedAt * 1000).toLocaleDateString('es-MX')}</small>
              </div>
              <div className="hn-trash-actions">
                <button type="button" onClick={() => void restoreOne(item)} disabled={busy}>
                  <RotateCcw size={16}/> Restaurar
                </button>
                <button className="danger" type="button" onClick={() => void purgeOne(item)} disabled={busy}>
                  <Trash2 size={16}/> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="hn-trash-empty">
          {filter === 'photo' ? <ImageIcon size={35}/> : <Trash2 size={35}/>}
          <h2>{filter === 'file' ? 'Todavía no hay archivos en la papelera.' : 'La papelera está vacía.'}</h2>
          <p>Los elementos que envíes aquí estarán disponibles para restaurar hasta que los elimines definitivamente.</p>
        </div>
      )}
    </main>
  );
}
