import type { Quote } from './types';

/** La demo solo acepta registros renderizables; nunca debe iniciar sin cotización activa. */
export const QUOTES_STORAGE_KEY = 'hn_quotes_visual_v1';
const VALID_STATUSES = new Set(['Borrador', 'Enviada', 'En revisión', 'Aceptada']);

export function parseStoredQuotes(raw: string | null, fallback: Quote[]): Quote[] {
  if (!raw) return fallback;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return fallback;
    const valid = data.every((value: unknown) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
      const q = value as Record<string, unknown>;
      return ['id', 'name', 'location', 'cover', 'status', 'note', 'package', 'desc']
        .every(key => typeof q[key] === 'string') &&
        typeof q.price === 'number' && Number.isFinite(q.price) && q.price >= 0 &&
        typeof q.deposit === 'number' && Number.isFinite(q.deposit) &&
        q.deposit >= 0 && q.deposit <= 100 &&
        VALID_STATUSES.has(q.status as string) &&
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
