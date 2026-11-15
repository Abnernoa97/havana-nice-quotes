import { useState } from 'react';
import { Check, Image as ImageIcon, X } from 'lucide-react';
import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import { CAROLINA_SLOTS, carolinaPhotos } from './CarolinaTemplate';

type Props = {
  item: Quote;
  photos: CloudPhoto[];
  onUpdate: (images: string[]) => void;
  openBank: () => void;
};

/** Exact six image positions from the original Canva collage; bank media only. */
export default function CarolinaGalleryEditor({ item, photos, onUpdate, openBank }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const slots = carolinaPhotos(item);
  const choose = (url: string) => {
    if (selected === null) return;
    const next = [...slots];
    next[selected] = url;
    onUpdate(next);
    setSelected(null);
  };
  return (
    <section className="hn-carolina-gallery-editor">
      <span className="eyebrow">PÁGINA 2 · COLLAGE ORIGINAL</span>
      <h4>Elige las seis fotografías</h4>
      <p>En orden, como la propuesta real: dos a la izquierda y cuatro a la derecha.</p>
      <div className="hn-carolina-gallery-slots">
        {Array.from({ length: CAROLINA_SLOTS }, (_, index) => (
          <button type="button" key={index}
            className={'hn-carolina-gallery-slot' + (selected === index ? ' active' : '')}
            aria-pressed={selected === index}
            aria-label={'Elegir fotografía de collage ' + (index + 1)}
            onClick={() => setSelected(selected === index ? null : index)}>
            {slots[index] ? <img src={slots[index]} alt="" loading="lazy"/> : <ImageIcon size={25}/>}
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="hn-carolina-gallery-picker">
          <div className="hn-carolina-gallery-picker-head">
            <strong>Fotografía {selected + 1}</strong>
            <button type="button" aria-label="Cerrar selector" onClick={() => setSelected(null)}><X size={17}/></button>
          </div>
          <div className="hn-carolina-gallery-choices">
            <button type="button" className="clear" onClick={() => choose('')}>
              <X size={17}/><span>Sin fotografía</span>
            </button>
            {photos.map(photo => (
              <button type="button" key={photo.id} aria-label={'Usar ' + photo.name}
                onClick={() => choose(photo.url)}>
                <img src={photo.url} loading="lazy" alt=""/>
                {slots[selected] === photo.url && <Check size={16}/>}
              </button>
            ))}
          </div>
          {!photos.length && (
            <button type="button" className="hn-photo-bank-link" onClick={openBank}>
              Subir fotografías a tu banco
            </button>
          )}
        </div>
      )}
    </section>
  );
}
