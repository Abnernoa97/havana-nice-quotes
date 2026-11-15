import { useCallback, useEffect, useRef, useState } from 'react';
import { processPhotoBatch } from './photo-batch';
import type { UploadBatchResult } from './photo-batch';

export type CloudPhoto = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  url: string;
};
export const photoSize = (size: number): string =>
  size < 1024 * 1024 ? (size / 1024).toFixed(0) + ' KB' :
    (size / (1024 * 1024)).toFixed(1) + ' MB';

export function useMediaLibrary(enabled: boolean) {
  const [photos, setPhotos] = useState<CloudPhoto[]>([]);
  const [bytesUsed, setBytesUsed] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const uploadLock = useRef(false);
  const deleteLock = useRef(false);
  const [deleting, setDeleting] = useState(false);

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
    const interval = setInterval(() => { void refreshPhotos(); }, 20000);
    return () => clearInterval(interval);
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

  /** Permanent R2 deletion; each successful DELETE also removes its D1 row. */
  const deletePhotos = useCallback(async (ids: string[]): Promise<{
    deleted: string[];
    failures: { id: string; reason: string }[];
  }> => {
    if (!enabled) throw new Error('El teléfono no está vinculado.');
    if (deleteLock.current || uploadLock.current) throw new Error('Hay otra operación en curso.');
    if (!ids.length) return { deleted: [], failures: [] };
    deleteLock.current = true;
    setDeleting(true);
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
      deleteLock.current = false;
      setDeleting(false);
    }
  }, [enabled, refreshPhotos]);

  return { photos, bytesUsed, uploadPhotos, uploading, uploadProgress, deleting, deletePhotos, refreshPhotos, error };
}
