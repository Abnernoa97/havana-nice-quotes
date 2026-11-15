import type { Quote } from './types';

/** La demo solo acepta registros renderizables; nunca debe iniciar sin cotización activa. */
export const QUOTES_STORAGE_KEY = 'hn_quotes_visual_v1';

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
        typeof q.price === 'number' && Number.isFinite(q.price) &&
        typeof q.deposit === 'number' && Number.isFinite(q.deposit) &&
        (q.messages === undefined || Array.isArray(q.messages));
    });
    return valid ? data as Quote[] : fallback;
  } catch {
    return fallback;
  }
}
