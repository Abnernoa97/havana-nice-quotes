import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Images, Smartphone, X } from 'lucide-react';
import { CAROLINA_FIELD_LABELS, isCarolinaCopyField } from '../templates/carolina-edit-fields';
import type { CarolinaTextField } from '../templates/carolina-edit-fields';
import { displayWeddingDate, parseWeddingDate, weddingWeekday } from '../../shared/lib/wedding-date';
import { normalizePriceInput, safeQuotePrice } from '../quotes/model';
import { quoteCurrency } from '../../shared/lib/formatters';
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
  const [textField, setTextField] = useState<CarolinaTextField | null>(null);
  const [dateDraft, setDateDraft] = useState('');
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(0); setTarget(null); setBank(false); setTextField(null);
  }, [item.id, item.style]);
  const openText = (field: CarolinaTextField) => {
    setTextField(field);
    setDateDraft(displayWeddingDate(item.date));
  };
  const closeText = () => setTextField(null);
  const changeText = (field: CarolinaTextField, value: string) => {
    if (field === 'date') {
      setDateDraft(value);
      const iso = parseWeddingDate(value);
      if (iso) edit('date', iso);
      else if (!value.trim()) edit('date', '');
    } else if (field === 'price') {
      edit('price', safeQuotePrice(normalizePriceInput(value)));
    } else if (isCarolinaCopyField(field)) {
      edit('carolinaCopy', { ...item.carolinaCopy, [field]: value.slice(0, 1500) });
    } else if (field !== 'deposit') {
      edit(field, value);
    }
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
              onClick={() => setPage(index)}><small>{index + 1}</small>{label}</button>
          ))}
        </nav>
      )}
      <div className="hn-canvas-sheet">
        {original ? (
          <>
            {page === 0 && (
              <div className="hn-canvas-cover">
                <CarolinaCover item={item} onEditText={openText}/>
                <button type="button" className="hn-canvas-cover-button"
                  onClick={() => open('cover')} aria-label="Elegir foto de portada">
                  {!item.cover && <span><ImagePlus size={22}/> Añadir foto</span>}
                </button>
              </div>
            )}
            {page === 1 && <CarolinaCollage item={item} onSelectPhoto={index => open(index)}/>}
            {page === 2 && <CarolinaTerms item={item} onEditText={openText}/>}
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
      {original && (
        <div className="hn-canvas-pager">
          <button type="button" disabled={page === 0} aria-label="Página anterior"
            onClick={() => setPage(page - 1)}><ChevronLeft size={18}/></button>
          <span>{page + 1} / {pages.length}</span>
          <button type="button" disabled={page === 2} aria-label="Página siguiente"
            onClick={() => setPage(page + 1)}><ChevronRight size={18}/></button>
        </div>
      )}
      {textField !== null && (
        <div className="hn-canvas-shade" onClick={event => {
          if (event.target === event.currentTarget) closeText();
        }}>
          <div className="hn-canvas-picker hn-canvas-text-picker" role="dialog"
            aria-modal="true" aria-label={'Editar ' + CAROLINA_FIELD_LABELS[textField]}>
            <header>
              <strong>{CAROLINA_FIELD_LABELS[textField]}</strong>
              <button type="button" aria-label="Terminar edición" onClick={closeText}>
                <X size={19}/>
              </button>
            </header>
            {textField === 'date' ? (
              <>
                <input autoFocus type="text" inputMode="text" placeholder="15/11/2027"
                  value={dateDraft} onChange={event => changeText('date', event.target.value)}
                  aria-label="Fecha de la celebración"/>
                <p className="hn-canvas-date-feedback">
                  {parseWeddingDate(dateDraft)
                    ? weddingWeekday(parseWeddingDate(dateDraft)!)
                    : dateDraft ? 'Escribe una fecha válida: 15/11/2027' : 'Sin fecha'}
                </p>
              </>
            ) : textField === 'deposit' ? (
              <div className="hn-canvas-deposit" role="group" aria-label="Anticipo">
                {[20, 30, 40, 50, 60, 70, 80, 90, 100].map(percent => (
                  <button key={percent} type="button" aria-pressed={item.deposit === percent}
                    className={item.deposit === percent ? 'selected' : ''}
                    onClick={() => { edit('deposit', percent); closeText(); }}>{percent}%</button>
                ))}
              </div>
            ) : textField === 'price' ? (
              <>
                <input autoFocus type="text" inputMode="numeric"
                  aria-label="Precio total" value={item.price || ''}
                  onChange={event => changeText('price', event.target.value)}/>
                <div className="hn-canvas-currency" role="group" aria-label="Moneda">
                  {(['USD', 'MX'] as const).map(currency => (
                    <button type="button" key={currency}
                      className={quoteCurrency(item.currency) === currency ? 'selected' : ''}
                      aria-pressed={quoteCurrency(item.currency) === currency}
                      onClick={() => edit('currency', currency)}>{currency}</button>
                  ))}
                </div>
              </>
            ) : (
              <textarea autoFocus rows={textField === 'desc' || textField === 'note' ||
                isCarolinaCopyField(textField) ? 4 : 2}
                maxLength={isCarolinaCopyField(textField) ? 1500 : 3000}
                value={isCarolinaCopyField(textField)
                  ? item.carolinaCopy?.[textField] || ''
                  : item[textField]}
                onChange={event => changeText(textField, event.target.value)}
                aria-label={CAROLINA_FIELD_LABELS[textField]}/>
            )}
            <button type="button" className="hn-canvas-text-done" onClick={closeText}>
              Listo
            </button>
          </div>
        </div>
      )}
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
