import type { Quote } from './types';
import { seed, photos } from './demo-data.ts';

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

/** Alta de borrador ficticio: mismas propiedades y valores del prototipo. */
export function createSampleDraft(id: string): Quote {
  return {
    ...seed[0],
    style: 'libre',
    readingMode: 'flip',
    id,
    name: 'New Couple',
    client: '',
    email: '',
    location: 'Destination, Mexico',
    date: '',
    price: 5900,
    status: 'Borrador',
    messages: [],
    cover: photos[0],
    note: 'Your celebration, your way.',
    package: 'Signature Live Band',
    desc: 'Live music planned with care for every moment of your celebration.',
  };
}

/** Devuelve una nueva lista y no toca los demás borradores. */
export function editSampleQuote(
  quotes: Quote[], id: string, key: keyof Quote, value: Quote[keyof Quote]
): Quote[] {
  return quotes.map(q => (q.id === id ? { ...q, [key]: value } : q));
}
