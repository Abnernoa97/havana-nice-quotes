import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent, PointerEvent, TouchEvent } from 'react';
import { ImagePlus, ImageIcon, CheckCircle2, X, ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react';
import type { CloudPhoto } from './useMediaLibrary';
import PhotoThumbnail from './PhotoThumbnail';
import { MAX_PHOTOS_PER_UPLOAD } from './photo-batch';
import type { UploadBatchResult } from './photo-batch';

type DeleteResult = {
  deleted: string[];
  failures: { id: string; reason: string }[];
};

type Props = {
  photos: CloudPhoto[];
  bytesUsed: number;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  trashing: boolean;
  error: string;
  uploadPhotos: (files: File[]) => Promise<UploadBatchResult<CloudPhoto>>;
  trashPhotos: (ids: string[]) => Promise<DeleteResult>;
  refreshPhotos: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
  viewerId: string | null;
  selectionMode: boolean;
  openViewer: (id: string) => void;
  changeViewer: (id: string) => void;
  closeViewer: () => void;
  startSelection: () => void;
  exitSelection: () => void;
};

/** Pure-image gallery; one tap opens full screen, a long press enables deletion. */
export default function PhotoBank({
  photos, uploading, uploadProgress, trashing, error, uploadPhotos, trashPhotos,
  refreshQuotes, viewerId, selectionMode, openViewer, changeViewer,
  closeViewer, startSelection, exitSelection,
}: Props) {
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef<{ x: number; y: number } | null>(null);
  const swallowClick = useRef(false);
  const touchStart = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const currentIndex = photos.findIndex(photo => photo.id === viewerId);
  const currentPhoto = currentIndex >= 0 ? photos[currentIndex] : null;

  useEffect(() => {
    if (!selectionMode) setSelected(new Set());
  }, [selectionMode]);

  useEffect(() => {
    if (viewerId) closeButton.current?.focus();
  }, [viewerId]);

  const moveViewer = (step: number) => {
    if (!photos.length || currentIndex < 0) return;
    const next = (currentIndex + step + photos.length) % photos.length;
    changeViewer(photos[next].id);
  };

  useEffect(() => {
    if (!viewerId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeViewer(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveViewer(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerId, currentIndex, photos, closeViewer, changeViewer]);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setMessage('');
    try {
      const result = await uploadPhotos(files);
      if (result.uploaded.length) {
        setMessage(result.uploaded.length + (result.uploaded.length === 1
          ? ' fotografía guardada y sincronizada.'
          : ' fotografías guardadas y sincronizadas.'));
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'No se pudieron subir las fotografías.');
    }
  };

  const clearHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    holdStart.current = null;
  };

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  const beginHold = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    // Reset any suppressed context-menu click on a fresh tap.
    swallowClick.current = false;
    if (selectionMode || event.button !== 0) return;
    clearHold();
    holdStart.current = { x: event.clientX, y: event.clientY };
    holdTimer.current = setTimeout(() => {
      swallowClick.current = true;
      startSelection();
      setSelected(new Set([id]));
      if ('vibrate' in navigator) navigator.vibrate(15);
      clearHold();
    }, 520);
  };
  const trackHold = (event: PointerEvent<HTMLButtonElement>) => {
    const start = holdStart.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) clearHold();
  };
  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const photoTap = (id: string) => {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    if (selectionMode) toggleSelected(id);
    else openViewer(id);
  };
  const longPressContext = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    clearHold();
    if (!selectionMode) {
      swallowClick.current = true;
      startSelection();
      setSelected(new Set([id]));
    } else toggleSelected(id);
  };

  const removeSelection = async () => {
    const ids = [...selected];
    if (!ids.length || trashing) return;
    if (!window.confirm('¿Enviar a la papelera ' + ids.length +
      (ids.length === 1 ? ' fotografía?' : ' fotografías?') +
      '\nPodrás recuperarlas desde Papelera.')) return;
    try {
      const result = await trashPhotos(ids);
      if (result.deleted.length) await refreshQuotes();
      if (!result.failures.length) {
        setSelected(new Set());
        exitSelection();
        setMessage(result.deleted.length + (result.deleted.length === 1
          ? ' fotografía enviada a Papelera.' : ' fotografías enviadas a Papelera.'));
      } else {
        setSelected(new Set(result.failures.map(f => f.id)));
        setMessage(result.deleted.length + ' enviadas a Papelera. ' +
          result.failures.length + ' no se pudieron mover.');
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'No se pudieron enviar a Papelera.');
    }
  };

  const onSwipeStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };
  const onSwipeEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0]?.clientX - touchStart.current;
    touchStart.current = null;
    if (delta && Math.abs(delta) > 65) moveViewer(delta < 0 ? 1 : -1);
  };

  return (
    <div className="page hn-photo-bank">
      <div className="intro-line hn-photo-bank-intro">
        <div className="hn-photo-bank-intro-content">
          <span className="eyebrow">HAVANA NICE · CLOUD LIBRARY</span>
          <h1>Banco de fotografías</h1>
          <p className="hn-media-intro-text">Tu material original, en un mismo lugar y disponible desde cualquier dispositivo.</p>
        </div>
      </div>
      <div className="hn-photo-upload-row">
        <label className={'btn primary hn-photo-upload' + (uploading ? ' busy' : '')}>
          <ImagePlus size={17}/>
          {uploading && uploadProgress ? 'Subiendo ' + uploadProgress.done + '/' + uploadProgress.total : 'Subir fotografías'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            multiple hidden disabled={uploading || trashing} onChange={onFile}/>
        </label>
        <small className="hn-photo-batch-hint">Hasta {MAX_PHOTOS_PER_UPLOAD} fotografías por selección</small>
      </div>
      {message && <p role="status" className="hn-photo-bank-success"><CheckCircle2 size={17}/>{message}</p>}
      {error && <p role="alert" className="hn-photo-bank-error">{error}</p>}

      {selectionMode && (
        <div className="hn-photo-selection-bar" role="toolbar" aria-label="Selección de fotografías">
          <strong>{selected.size} {selected.size === 1 ? 'seleccionada' : 'seleccionadas'}</strong>
          <div>
            <button type="button" onClick={() => { setSelected(new Set()); exitSelection(); }} disabled={trashing}>Cancelar</button>
            <button type="button" className="danger" onClick={() => void removeSelection()}
              disabled={!selected.size || trashing}>
              <Trash2 size={17}/> {trashing ? 'Moviendo...' : 'Papelera'}
            </button>
          </div>
        </div>
      )}

      {photos.length ? (
        <div className="hn-photo-bank-grid" aria-label="Galería de fotos. Toca para ampliar o mantén pulsada una foto para seleccionar.">
          {photos.map((photo,index) => (
            <button key={photo.id} type="button"
              className={'hn-photo-bank-item' + (selected.has(photo.id) && selectionMode ? ' is-selected' : '')}
              aria-label={(selectionMode ? 'Seleccionar ' : 'Ampliar ') + photo.name}
              aria-pressed={selectionMode ? selected.has(photo.id) : undefined}
              onPointerDown={event => beginHold(event, photo.id)}
              onPointerMove={trackHold} onPointerUp={clearHold}
              onPointerCancel={clearHold} onPointerLeave={clearHold}
              onContextMenu={event => longPressContext(event, photo.id)}
              onClick={() => photoTap(photo.id)}>
              <PhotoThumbnail photo={photo} priority={index<4}/>
              {selected.has(photo.id) && selectionMode && (
                <span className="hn-photo-check" aria-hidden="true"><Check size={17}/></span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="hn-photo-bank-empty">
          <ImageIcon size={40} strokeWidth={1.1}/>
          <h2>Una biblioteca lista para tus fotografías.</h2>
          <p>Aún no hay fotos subidas a Quotes Studio. Las que agregues aquí aparecerán también en Diseño, para elegir una portada.</p>
        </div>
      )}

      {currentPhoto && (
        <div className="hn-photo-lightbox" role="dialog" aria-modal="true" aria-label="Visor de fotografías">
          <button ref={closeButton} className="hn-photo-lightbox-close" type="button"
            aria-label="Cerrar fotografía" onClick={closeViewer}><X size={25}/></button>
          <div className="hn-photo-lightbox-view" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
            <img src={currentPhoto.url} alt={'Fotografía ' + (currentIndex + 1)} draggable={false}/>
          </div>
          {photos.length > 1 && (
            <>
              <button className="hn-photo-lightbox-prev" type="button" aria-label="Fotografía anterior"
                onClick={() => moveViewer(-1)}><ChevronLeft size={26}/></button>
              <button className="hn-photo-lightbox-next" type="button" aria-label="Fotografía siguiente"
                onClick={() => moveViewer(1)}><ChevronRight size={26}/></button>
            </>
          )}
          <span className="hn-photo-lightbox-count" aria-live="polite">{currentIndex + 1} / {photos.length}</span>
        </div>
      )}
    </div>
  );
}
