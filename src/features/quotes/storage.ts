import type { Quote } from './types';

/** La demo solo acepta registros renderizables; nunca debe iniciar sin cotización activa. */
export const QUOTES_STORAGE_KEY = 'hn_quotes_visual_v1';
const VALID_STATUSES = new Set(['Borrador', 'Enviada', 'En revisión', 'Aceptada']);
const REQUIRED_TEXT_FIELDS = [
  'id', 'name', 'client', 'email', 'location', 'date',
  'cover', 'font', 'color', 'note', 'package', 'desc',
] as const;

export function parseStoredQuotes(raw: string | null, fallback: Quote[]): Quote[] {
  if (!raw) return fallback;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return fallback;
    const ids = new Set<string>();
    const valid = data.every((value: unknown) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
      const q = value as Record<string, unknown>;
      if (!REQUIRED_TEXT_FIELDS.every(key => typeof q[key] === 'string')) return false;
      const id = q.id as string;
      if (!id.trim() || ids.has(id)) return false;
      ids.add(id);
      return typeof q.price === 'number' && Number.isFinite(q.price) && q.price >= 0 &&
        typeof q.deposit === 'number' && Number.isFinite(q.deposit) &&
        q.deposit >= 0 && q.deposit <= 100 &&
        VALID_STATUSES.has(q.status as string) &&
        (q.style === undefined || typeof q.style === 'string') &&
        (q.readingMode === undefined || typeof q.readingMode === 'string') &&
        (q.messages === undefined || (
          Array.isArray(q.messages) && q.messages.every((message: unknown) => {
            if (typeof message !== 'object' || message === null || Array.isArray(message)) return false;
            const entry = message as Record<string, unknown>;
            return ['from', 'text', 'time'].every(key => typeof entry[key] === 'string');
          })
        ));
    });
    return valid ? data as Quote[] : fallback;
  } catch {
    return fallback;
  }
}
