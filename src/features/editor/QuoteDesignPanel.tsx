import type { ChangeEvent } from 'react';
import { Check, UploadCloud } from 'lucide-react';
import { photos } from '../quotes/demo-data';

type DesignQuote = {
  cover: string;
  font: string;
  color: string;
};
type DesignField = keyof DesignQuote;
type Props = {
  item: DesignQuote;
  edit: (key: DesignField, value: string) => void;
  filePicked: (event: ChangeEvent<HTMLInputElement>) => void;
};

/** QN-00.07: diseño existente. No cambia subida local, CSS ni clases. */
export default function QuoteDesignPanel({ item, edit, filePicked }: Props) {
  return (
    <div className="edit-body">
              <span className="eyebrow">VISUAL IDENTITY</span>
              <h3>Hazla completamente tuya</h3>
              <label>Fotografía de portada</label>
              <div className="photo-options">
                {photos.map((ph, i) => (
                  <button
                    key={i}
                    className={
                      item.cover === ph ? 'photo-option chosen' : 'photo-option'
                    }
                    onClick={() => edit('cover', ph)}
                    style={{ backgroundImage: 'url(' + ph + ')' }}
                  >
                    {item.cover === ph && <Check size={17} />}
                  </button>
                ))}
              </div>
              <label className="upload-btn">
                <UploadCloud size={18} />
                <span>Subir una fotografía</span>
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={filePicked}
                />
              </label>
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
                Los cambios se reflejan inmediatamente en la vista previa.
              </p>
            </div>
  );
}
