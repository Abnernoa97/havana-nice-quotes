import type { Quote } from './types';

/** La búsqueda de la demo conserva la combinación pareja + destino. */
export function filterQuotes(quotes: Quote[], filter: string, search: string): Quote[] {
  return quotes.filter(
    q =>
      (filter === 'Todas' || q.status === filter) &&
      [q.name, q.location]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
  );
}

export function statusClass(s: string): string {
  return s === 'Aceptada'
    ? 'green'
    : s === 'En revisión'
      ? 'gold'
      : s === 'Enviada'
        ? 'blue'
        : 'gray';
}
