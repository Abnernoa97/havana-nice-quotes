import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { CloudUpload, ImagePlus, ImageIcon, CheckCircle2, RefreshCcw } from 'lucide-react';
import type { CloudPhoto } from './useMediaLibrary';
import { photoSize } from './useMediaLibrary';
type Props = {
  photos: CloudPhoto[];
  bytesUsed: number;
  uploading: boolean;
  error: string;
  uploadPhoto: (file: File) => Promise<CloudPhoto>;
  refreshPhotos: () => Promise<void>;
};
export default function PhotoBank({ photos, bytesUsed, uploading, error, uploadPhoto, refreshPhotos }: Props) {
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
    </div>
  );
}
