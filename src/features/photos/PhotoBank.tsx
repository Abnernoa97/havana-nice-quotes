import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { CloudUpload, ImagePlus, ImageIcon, CheckCircle2, RefreshCcw } from 'lucide-react';
import type { CloudPhoto } from './useMediaLibrary';
import { photoSize } from './useMediaLibrary';
type Props = {
  photos: CloudPhoto[];
  brandPhotos: CloudPhoto[];
  onUsePhoto: (url: string) => void;
  canUsePhoto: boolean;
  bytesUsed: number;
  uploading: boolean;
  error: string;
  uploadPhoto: (file: File) => Promise<CloudPhoto>;
  refreshPhotos: () => Promise<void>;
};
export default function PhotoBank({ photos, brandPhotos, onUsePhoto, canUsePhoto, bytesUsed, uploading, error, uploadPhoto, refreshPhotos }: Props) {
  const [message, setMessage] = useState('');
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage('');
    try {
      await uploadPhoto(file);
      setMessage('Fotografía guardada en Cloudflare R2 y disponible en todos tus dispositivos.');
    } catch {
      setMessage('');
    }
  };
  return (
    <div className="page hn-photo-bank">
      <div className="intro-line">
        <div>
          <span className="eyebrow">HAVANA NICE · CLOUD LIBRARY</span>
          <h1>Banco de fotografías</h1>
          <p>Tu material original, en un mismo lugar y disponible desde cualquier dispositivo.</p>
        </div>
        <label className={'btn primary hn-photo-upload' + (uploading ? ' busy' : '')}>
          <ImagePlus size={17}/>
          {uploading ? 'Subiendo...' : 'Subir fotografía'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" hidden
            disabled={uploading} onChange={onFile}/>
        </label>
      </div>
      <div className="hn-photo-bank-meta">
        <div><CloudUpload size={20}/><strong>{photos.length}</strong><span>Fotografías en Quotes Studio</span></div>
        <div><ImageIcon size={20}/><strong>{photoSize(bytesUsed)}</strong><span>Almacenamiento de esta biblioteca</span></div>
        <div><ImageIcon size={20}/><strong>{brandPhotos.length}</strong><span>Fotos optimizadas de HAVANA NICE v2</span></div>
        <button type="button" onClick={() => void refreshPhotos()}><RefreshCcw size={16}/> Actualizar biblioteca</button>
      </div>
      {message && <p role="status" className="hn-photo-bank-success"><CheckCircle2 size={17}/>{message}</p>}
      {error && <p role="alert" className="hn-photo-bank-error">{error}</p>}
      {photos.length ? (
        <div className="hn-photo-bank-grid">
          {photos.map(p => (
            <figure key={p.id} className="hn-photo-bank-item">
              <img src={p.url} alt={p.name} loading="lazy"/>
              <figcaption><strong title={p.name}>{p.name}</strong><span>{photoSize(p.size)}</span></figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="hn-photo-bank-empty">
          <ImageIcon size={40} strokeWidth={1.1}/>
          <h2>Una biblioteca lista para tus fotografías.</h2>
          <p>Aún no hay fotos subidas a Quotes Studio. Las que agregues aquí aparecerán también en Diseño, para elegir una portada.</p>
        </div>
      )}
      {!!brandPhotos.length && (
        <section className="hn-photo-existing">
          <div className="hn-photo-existing-heading">
            <span className="eyebrow">EXISTING HAVANA NICE ASSETS · READ ONLY</span>
            <h2>Fotografías de HAVANA NICE v2</h2>
            <p>Estas fotos ya estaban en R2. Se pueden utilizar en propuestas sin duplicar ni mover los originales.</p>
          </div>
          <div className="hn-photo-bank-grid">
            {brandPhotos.map(photo => (
              <figure key={photo.id} className="hn-photo-bank-item">
                <img src={photo.url} alt={photo.name} loading="lazy"/>
                <figcaption><strong title={photo.name}>{photo.name}</strong><span>{photoSize(photo.size)}</span></figcaption>
                {canUsePhoto && <button type="button" className="hn-photo-use" onClick={() => onUsePhoto(photo.url)}>
                  Usar de portada
                </button>}
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
