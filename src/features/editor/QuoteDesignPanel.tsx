import type { ChangeEvent } from 'react';
import { Check, UploadCloud } from 'lucide-react';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import { MAX_PHOTOS_PER_UPLOAD } from '../photos/photo-batch';
import type { Quote } from '../quotes/types';
import CarolinaGalleryEditor from '../templates/CarolinaGalleryEditor';
import '../templates/carolina-editor.css';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  filePicked: (event: ChangeEvent<HTMLInputElement>) => void;
  cloudPhotos: CloudPhoto[];
  onOpenBank: () => void;
};

/** QN-00.07: diseño existente. No cambia subida local, CSS ni clases. */
export default function QuoteDesignPanel({ item, edit, filePicked, cloudPhotos, onOpenBank }: Props) {
  return (
    <div className="edit-body">
              <span className="eyebrow">VISUAL IDENTITY</span>
              <h3>Hazla completamente tuya</h3>
              <label>Fotografía de portada</label>
              <div className="photo-options">
                {cloudPhotos.map(ph => (
                  <button type="button" aria-label={'Usar ' + ph.name + ' de portada'}
                    key={ph.id} title={ph.name}
                    className={item.cover === ph.url ? 'photo-option chosen' : 'photo-option'}
                    onClick={() => edit('cover', ph.url)}
                    style={{ backgroundImage: 'url(' + ph.url + ')' }}
                  >
                    {item.cover === ph.url && <Check size={17}/>}
                  </button>
                ))}
              </div>
              {!cloudPhotos.length && (
                <p className="hn-photo-picker-empty">Tu banco de fotos está vacío. Sube la primera y aparecerá aquí en todos los dispositivos.</p>
              )}
              <button type="button" className="hn-photo-bank-link" onClick={onOpenBank}>
                Abrir banco de fotografías
              </button>
              <label className="upload-btn">
                <UploadCloud size={18} />
                <span>Subir hasta {MAX_PHOTOS_PER_UPLOAD} fotografías</span>
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                  onChange={filePicked}
                />
              </label>
              {item.style === 'carolina' && (
                <CarolinaGalleryEditor item={item} photos={cloudPhotos}
                  onUpdate={gallery => edit('gallery', gallery)} openBank={onOpenBank}/>
              )}
              <div className="edit-separator" />
              <label>Tipografía del título</label>
              <div className="font-options">
                <button
                  className={item.font === 'editorial' ? 'selected' : ''}
                  onClick={() => edit('font', 'editorial')}
                >
                  <span className="font-sample">Aa</span>Editorial Serif
                </button>
                <button
                  className={item.font === 'modern' ? 'selected' : ''}
                  onClick={() => edit('font', 'modern')}
                >
                  <span className="font-sample sans">Aa</span>Modern Clean
                </button>
              </div>
              <label>Color principal</label>
              <div className="swatches">
                {['#18342f', '#3e5240', '#8c735d', '#302d2b', '#92655b'].map(
                  c => (
                    <button
                      aria-label={'Choose ' + c}
                      onClick={() => edit('color', c)}
                      key={c}
                      style={{ backgroundColor: c }}
                      className={item.color === c ? 'swatch on' : 'swatch'}
                    ></button>
                  )
                )}
                <label className="color-circle">
                  <input
                    type="color"
                    value={item.color}
                    onChange={e => edit('color', e.target.value)}
                  />
                </label>
              </div>
              <p className="helper">
                Los cambios se reflejan en la propuesta y se guardan en la nube.
              </p>
            </div>
  );
}
