import { useCallback, useEffect, useRef, useState } from 'react';
import { processPhotoBatch } from './photo-batch';
import type { UploadBatchResult } from './photo-batch';
import {thumbnailFromFile,savePhotoThumbnail} from './photo-thumbnails';

export type CloudPhoto = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  url: string;
  thumbnailUrl?:string;
};
export function useMediaLibrary(enabled: boolean) {
  const [photos, setPhotos] = useState<CloudPhoto[]>([]);
  const [bytesUsed, setBytesUsed] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const uploadLock = useRef(false);
  const trashLock = useRef(false);
  const [trashing, setTrashing] = useState(false);

  const refreshPhotos = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch('/api/media', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('Photo library unavailable');
      const data = await res.json() as { photos: CloudPhoto[]; bytesUsed: number };
      setPhotos(data.photos || []);
      setBytesUsed(data.bytesUsed || 0);
      setError('');
    } catch {
      setError('No se pudo actualizar el banco de fotografías.');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPhotos([]);
      setBytesUsed(0);
      return;
    }
    void refreshPhotos();
    // Avoid repeated full-index queries while designing or with the app backgrounded.
    const onVisible=()=>{if(document.visibilityState==='visible')void refreshPhotos();};
    document.addEventListener('visibilitychange',onVisible);
    const interval=setInterval(()=>{
      if(document.visibilityState==='visible')void refreshPhotos();
    },120000);
    return ()=>{
      clearInterval(interval);
      document.removeEventListener('visibilitychange',onVisible);
    };
  }, [enabled, refreshPhotos]);

  const uploadPhotos = useCallback(async (files: File[]): Promise<UploadBatchResult<CloudPhoto>> => {
    if (!enabled) throw new Error('El teléfono no está vinculado con el estudio.');
    if (uploadLock.current) throw new Error('Ya hay una subida en curso.');
    // Validate the batch before sending even one object to R2.
    if (files.length > 10) throw new Error('Selecciona como máximo 10 fotografías a la vez.');
    if (!files.length) return { uploaded: [], failures: [] };
    uploadLock.current = true;
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    setError('');
    try {
      const result = await processPhotoBatch(files, async file => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(file.type)) {
          throw new Error('Formato de imagen no compatible.');
        }
        if (!file.size || file.size > 12 * 1024 * 1024) {
          throw new Error('Cada fotografía debe pesar menos de 12 MB.');
        }
        const response = await fetch('/api/media', {
          method: 'POST', credentials: 'same-origin',
          headers: {
            'Content-Type': file.type,
            'X-File-Name': encodeURIComponent(file.name),
          },
          body: file,
        });
        const data = await response.json() as { photo?: CloudPhoto; error?: string };
        if (!response.ok || !data.photo) {
          throw new Error(data.error || 'No se pudo subir la fotografía.');
        }
        // One small, private JPEG per photo. Failure never rolls back the original.
        const thumb=await thumbnailFromFile(file).catch(()=>null);
        if(thumb)await savePhotoThumbnail(data.photo.id,thumb).catch(()=>{});
        return data.photo;
      }, (done, total) => setUploadProgress({ done, total }));
      // One refresh after the whole batch, not ten requests for the gallery.
      if (result.uploaded.length) await refreshPhotos();
      if (result.failures.length) {
        setError(result.failures.map(f => f.filename + ': ' + f.reason).join(' · '));
      }
      return result;
    } finally {
      uploadLock.current = false;
      setUploading(false);
      setUploadProgress(null);
    }
  }, [enabled, refreshPhotos]);

  /** Move to the unified Trash. R2 remains until explicitly purged. */
  const trashPhotos = useCallback(async (ids: string[]): Promise<{
    deleted: string[];
    failures: { id: string; reason: string }[];
  }> => {
    if (!enabled) throw new Error('El teléfono no está vinculado.');
    if (trashLock.current || uploadLock.current) throw new Error('Hay otra operación en curso.');
    if (!ids.length) return { deleted: [], failures: [] };
    trashLock.current = true;
    setTrashing(true);
    setError('');
    const deleted: string[] = [];
    const failures: { id: string; reason: string }[] = [];
    try {
      for (const id of [...new Set(ids)]) {
        try {
          const response = await fetch('/api/media/' + encodeURIComponent(id), {
            method: 'DELETE', credentials: 'same-origin',
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(body.error || 'No se pudo eliminar la foto.');
          }
          deleted.push(id);
        } catch (cause) {
          failures.push({ id, reason: cause instanceof Error ? cause.message : 'Error al eliminar.' });
        }
      }
      await refreshPhotos();
      if (failures.length) setError(failures.length + ' fotografía(s) no se pudieron eliminar. Intenta de nuevo.');
      return { deleted, failures };
    } finally {
      trashLock.current = false;
      setTrashing(false);
    }
  }, [enabled, refreshPhotos]);

  return { photos, bytesUsed, uploadPhotos, uploading, uploadProgress, trashing, trashPhotos, refreshPhotos, error };
}
