import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Images, Smartphone, Type, X } from 'lucide-react';
import { isCarolinaCopyField } from '../templates/carolina-edit-fields';
import ElegantFontBank from './ElegantFontBank';
import type { ElegantFontId } from '../templates/elegant-fonts';
import type { CarolinaTextField } from '../templates/carolina-edit-fields';
import { parseWeddingDate } from '../../shared/lib/wedding-date';
import type { CarolinaTextInteraction } from '../templates/CarolinaTextNode';
import type { CarolinaFixedKey, CarolinaLayout, CarolinaTransform } from '../templates/carolina-layout';
import { carolinaPhotoOrder, movePhotoSlot, photoSlotToAdd, emptyPhotoSlotToDuplicate, CAROLINA_MAX_SLOTS } from '../templates/carolina-layout';
import { normalizePriceInput, safeQuotePrice } from '../quotes/model';
import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import Proposal from '../client/Proposal';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, carolinaPhotos } from '../templates/CarolinaTemplate';
import './template-canvas.css';

export type PhotoTarget = 'cover' | number;
type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  photos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<void>;
};
const pages = ['Portada', 'Collage', 'Propuesta'] as const;

/** A real preview becomes the editor: 3 Canva pages, 7 independently selectable photo regions. */
export default function TemplateCanvasEditor({ item, edit, photos, onUploadPhoto }: Props) {
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<PhotoTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastTextId, setLastTextId] = useState<string | null>(null);
  const [fontBankOpen, setFontBankOpen] = useState(false);
  const [fontTarget, setFontTarget] = useState<string | null>(null);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(0); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setFontBankOpen(false); setFontTarget(null);
  }, [item.id, item.style]);
  const updateLayout = (patch: Partial<CarolinaLayout>) => {
    edit('carolinaLayout', { ...item.carolinaLayout, ...patch });
  };
  const textInteraction: CarolinaTextInteraction = {
    editingId, transformingId,
    onTap: id => { setTransformingId(null); setEditingId(id); setLastTextId(id); setError(''); },
    onSelectTransform: id => { setEditingId(null); setTransformingId(id);
      setLastTextId(id.startsWith('photo:') ? null : id); setError(''); },
    onCommitText: (id, raw) => {
      const value = raw.trim().slice(0, 3000);
      if (id.startsWith('fixed:')) {
        const key = id.slice(6) as CarolinaFixedKey;
        updateLayout({ fixed: { ...item.carolinaLayout?.fixed, [key]: value.slice(0, 1200) } });
      } else if (id.startsWith('extra:')) {
        const extras = item.carolinaLayout?.extras || [];
        updateLayout({ extras: value
          ? extras.map(e => 'extra:' + e.id === id ? { ...e, text: value } : e)
          : extras.filter(e => 'extra:' + e.id !== id) });
      } else if (id.startsWith('field:')) {
        const field = id.slice(6) as CarolinaTextField;
        if (field === 'date') {
          const date = value ? parseWeddingDate(value) : '';
          if (date !== null) edit('date', date);
          else setError('Fecha incorrecta. Escribe 15/11/2027.');
        } else if (field === 'price') {
          edit('price', safeQuotePrice(normalizePriceInput(value)));
        } else if (field === 'deposit') {
          const percent = Number(value.replace(/[^0-9]/g, ''));
          if (!value || [20, 30, 40, 50, 60, 70, 80, 90, 100].includes(percent)) {
            edit('deposit', value ? percent : 0);
          } else setError('Anticipo permitido: 20%, 30%... hasta 100%.');
        } else if (isCarolinaCopyField(field)) {
          edit('carolinaCopy', { ...item.carolinaCopy, [field]: value.slice(0, 1500) });
        } else edit(field, value);
      }
      setEditingId(null);
    },
    onCommitTransform: (id: string, transform: CarolinaTransform) => {
      updateLayout({ transforms: { ...item.carolinaLayout?.transforms, [id]: transform } });
    },
  };
  const addFreeText = () => {
    if (!original) return;
    const id = crypto.randomUUID();
    updateLayout({ extras: [...(item.carolinaLayout?.extras || []), {
      id, page: page as 0 | 1 | 2, text: '',
    }] });
    setTransformingId(null);
    setEditingId('extra:' + id);
    setLastTextId('extra:' + id);
  };
  const openFontBank = () => {
    setFontTarget(lastTextId);
    if (editingId && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setEditingId(null);
    setTransformingId(null);
    setFontBankOpen(true);
  };
  const chooseFont = (font: ElegantFontId | null) => {
    if (fontTarget) {
      const fonts={...item.carolinaLayout?.fonts};
      if (font) fonts[fontTarget]=font;
      else delete fonts[fontTarget];
      updateLayout({fonts});
    } else {
      updateLayout({defaultFont:font || undefined});
    }
    setFontBankOpen(false);
  };
  const photoOrder = carolinaPhotoOrder(item.carolinaLayout);
  const activePhoto = transformingId?.match(/^photo:(\d+)$/);
  const selectedPhoto = activePhoto ? Number(activePhoto[1]) : null;
  const setPhotoOrder = (order: number[]) => updateLayout({ photoOrder: order });
  const addPhotoBlock = () => {
    const slot = photoSlotToAdd(photoOrder, carolinaPhotos(item));
    if (slot === null) return;
    setPhotoOrder([...photoOrder, slot]);
    setTransformingId(null);
    setTarget(slot);
    setBank(false);
  };
  const reorderPhotoBlock = (slot: number, direction: -1 | 1) =>
    setPhotoOrder(movePhotoSlot(photoOrder, slot, direction));
  const hidePhotoBlock = (slot: number) => {
    if (photoOrder.length <= 1) return;
    setPhotoOrder(photoOrder.filter(index => index !== slot));
    setTransformingId(null);
  };
  const duplicatePhotoBlock = (slot: number) => {
    const gallery = carolinaPhotos(item);
    const next = emptyPhotoSlotToDuplicate(photoOrder, gallery);
    if (next === null) {
      setError('Las 12 posiciones están ocupadas. Quita un recuadro o reutiliza uno.');
      return;
    }
    gallery[next] = gallery[slot] || '';
    edit('gallery', gallery); // Same R2 photograph, no copied or uploaded file.
    setPhotoOrder([...photoOrder, next]);
    setTransformingId('photo:' + next);
    setError('');
  };
  const open = (slot: PhotoTarget) => { setTarget(slot); setBank(false); setError(''); };
  const close = () => { if (!busy) { setTarget(null); setBank(false); setError(''); } };
  const choose = (url: string) => {
    if (target === null) return;
    if (target === 'cover') edit('cover', url);
    else {
      const gallery = carolinaPhotos(item);
      gallery[target] = url;
      edit('gallery', gallery);
    }
    close();
  };
  const selectPhone = async (file?: File) => {
    if (!file || target === null) return;
    setBusy(true);
    try {
      await onUploadPhoto(file, target);
      setTarget(null);
      setBank(false);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la fotografía.'); }
    finally { setBusy(false); }
  };
  const original = !item.style || item.style === 'carolina';
  return (
    <section className="hn-canvas">
      {original && (
        <nav className="hn-canvas-pages" aria-label="Páginas de la plantilla">
          {pages.map((label, index) => (
            <button key={label} type="button" className={page === index ? 'selected' : ''}
              aria-current={page === index ? 'page' : undefined}
              onClick={() => { setPage(index); setTransformingId(null); setEditingId(null); setLastTextId(null); }}><small>{index + 1}</small>{label}</button>
          ))}
        </nav>
      )}
      {original && <div className="hn-canvas-toolbar">
        <button type="button" onClick={addFreeText}>+ Texto</button>
        <button type="button" onClick={openFontBank} aria-label="Abrir banco de tipografías">
          <Type size={16}/> Tipografías
        </button>
        {page === 1 && <button type="button" disabled={photoOrder.length >= CAROLINA_MAX_SLOTS}
          onClick={addPhotoBlock}>+ Foto</button>}
        {page === 1 && <span>{photoOrder.length} fotos</span>}
        {transformingId && <span>Arrastra · Amplía o gira con dos dedos</span>}
      </div>}
      <div className="hn-canvas-sheet" onPointerDown={event => {
        const target = event.target;
        if (target instanceof Element && !target.closest('[data-carolina-text], .hn-carolina-photo, .hn-carolina-cover-photo')) {
          setTransformingId(null);
          setLastTextId(null);
          if (editingId && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }}>
        {original ? (
          <>
            {page === 0 && (
              <div className="hn-canvas-cover">
                <CarolinaCover item={item} interaction={textInteraction}
                  onSelectCover={() => open('cover')}/>
              </div>
            )}
            {page === 1 && <CarolinaCollage item={item} onSelectPhoto={index => open(index)} interaction={textInteraction}/>}
            {page === 2 && <CarolinaTerms item={item} interaction={textInteraction}/>}
          </>
        ) : (
          <div className="hn-canvas-editorial">
            <Proposal item={item} styleName={item.style || 'libre'} embedded/>
            <button type="button" onClick={() => open('cover')}>
              <ImagePlus size={17}/> Cambiar portada
            </button>
          </div>
        )}
      </div>
      {original && page === 1 && selectedPhoto !== null &&
        photoOrder.includes(selectedPhoto) && (
        <div className="hn-canvas-photo-actions" role="group" aria-label="Ordenar fotografías">
          <span>Foto {photoOrder.indexOf(selectedPhoto) + 1}</span>
          <button type="button" disabled={photoOrder.indexOf(selectedPhoto) === 0}
            onClick={() => reorderPhotoBlock(selectedPhoto, -1)}>Anterior</button>
          <button type="button" disabled={photoOrder.indexOf(selectedPhoto) === photoOrder.length - 1}
            onClick={() => reorderPhotoBlock(selectedPhoto, 1)}>Siguiente</button>
          <button type="button" disabled={photoOrder.length >= CAROLINA_MAX_SLOTS}
            onClick={() => duplicatePhotoBlock(selectedPhoto)}>Duplicar</button>
          <button type="button" disabled={photoOrder.length <= 1}
            onClick={() => hidePhotoBlock(selectedPhoto)}>Quitar</button>
        </div>
      )}
      {original && (
        <div className="hn-canvas-pager">
          <button type="button" disabled={page === 0} aria-label="Página anterior"
            onClick={() => { setPage(page - 1); setTransformingId(null); setEditingId(null); setLastTextId(null); }}><ChevronLeft size={18}/></button>
          <span>{page + 1} / {pages.length}</span>
          <button type="button" disabled={page === 2} aria-label="Página siguiente"
            onClick={() => { setPage(page + 1); setTransformingId(null); setEditingId(null); setLastTextId(null); }}><ChevronRight size={18}/></button>
        </div>
      )}
      {fontBankOpen && (
        <ElegantFontBank targetName={fontTarget ? 'Texto seleccionado' : 'Toda la propuesta'}
          activeFont={fontTarget ? (item.carolinaLayout?.fonts?.[fontTarget] ||
            item.carolinaLayout?.defaultFont) : item.carolinaLayout?.defaultFont}
          resetLabel={fontTarget && item.carolinaLayout?.defaultFont
            ? 'Usar tipografía general' : 'Restaurar tipografía original'}
          onChoose={chooseFont} onClose={()=>setFontBankOpen(false)}/>
      )}
      {error && !target && <p className="hn-canvas-error" role="alert">{error}</p>}
      {target !== null && (
        <div className="hn-canvas-shade" onClick={event => {
          if (event.target === event.currentTarget) close();
        }}>
          <div className="hn-canvas-picker" role="dialog" aria-modal="true"
            aria-label={target === 'cover' ? 'Foto de portada' : 'Foto ' + (target + 1)}>
            <header><strong>{target === 'cover' ? 'Foto de portada' : 'Foto ' + (target + 1)}</strong>
              <button type="button" disabled={busy} aria-label="Cerrar" onClick={close}><X size={19}/></button>
            </header>
            <div className="hn-canvas-sources">
              <label className="hn-canvas-source"><Smartphone size={21}/> Mi teléfono
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                  disabled={busy} onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    void selectPhone(file);
                  }}/>
              </label>
              <button type="button" className={bank ? 'hn-canvas-source selected' : 'hn-canvas-source'}
                disabled={busy} onClick={() => setBank(v => !v)}><Images size={21}/> Banco de fotos</button>
            </div>
            {bank && (
              <div className="hn-canvas-bank">
                {photos.map(photo => (
                  <button type="button" key={photo.id} disabled={busy}
                    aria-label={'Elegir ' + photo.name} onClick={() => choose(photo.url)}>
                    <img src={photo.url} alt="" loading="lazy"/>
                    {(target === 'cover' ? item.cover === photo.url :
                      carolinaPhotos(item)[target] === photo.url) && <Check size={16}/>}
                  </button>
                ))}
                {!photos.length && <p>Tu banco está vacío.</p>}
                <button type="button" className="hn-canvas-remove" disabled={busy}
                  onClick={() => choose('')}>Quitar fotografía</button>
              </div>
            )}
            {busy && <p className="hn-canvas-message" role="status">Subiendo fotografía...</p>}
            {error && <p className="hn-canvas-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
