/** A batch is capped at ten; the whole cloud gallery has no item limit. */
export const MAX_PHOTOS_PER_UPLOAD = 10;

export type UploadFailure = { filename: string; reason: string };
export type UploadBatchResult<T> = { uploaded: T[]; failures: UploadFailure[] };

/** Upload sequentially to avoid spikes on mobile and preserve successful files. */
export async function processPhotoBatch<T>(
  files: readonly File[],
  upload: (file: File) => Promise<T>,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadBatchResult<T>> {
  if (files.length > MAX_PHOTOS_PER_UPLOAD) {
    throw new Error('Selecciona como máximo 10 fotografías a la vez.');
  }
  const uploaded: T[] = [];
  const failures: UploadFailure[] = [];
  for (const [index, file] of files.entries()) {
    try {
      uploaded.push(await upload(file));
    } catch (cause) {
      failures.push({
        filename: file.name,
        reason: cause instanceof Error ? cause.message : 'No se pudo subir.',
      });
    }
    onProgress?.(index + 1, files.length);
  }
  return { uploaded, failures };
}
