import { useCallback, useEffect, useState } from 'react';

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

  const uploadPhoto = useCallback(async (file: File): Promise<CloudPhoto> => {
    if (!enabled) throw new Error('Inicia sesión para subir fotografías.');
    if (!file.type.startsWith('image/')) throw new Error('Selecciona una imagen.');
    if (file.size > 12 * 1024 * 1024) throw new Error('La foto supera 12 MB.');
    setUploading(true);
    setError('');
    try {
      const response = await fetch('/api/media', {
        method: 'POST', credentials: 'same-origin',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      });
      const data = await response.json() as { photo?: CloudPhoto; error?: string };
      if (!response.ok || !data.photo) throw new Error(data.error || 'No se pudo subir la fotografía.');
      await refreshPhotos();
      return data.photo;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Error al subir.';
      setError(message);
      throw cause;
    } finally {
      setUploading(false);
    }
  }, [enabled, refreshPhotos]);

  return { photos, bytesUsed, uploadPhoto, uploading, refreshPhotos, error };
}
