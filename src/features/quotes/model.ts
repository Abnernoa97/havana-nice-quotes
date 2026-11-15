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
    currency: 'USD',
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

/** Text input for whole-number quotes: never keeps a default or pasted leading zero. */
export function normalizePriceInput(input: string): string {
  return input.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
}

/** Los inputs numéricos pueden producir valores negativos, Infinity o NaN durante la edición. */
export function safeQuotePrice(input: string): number {
  const value = Number(input);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function safeQuoteDeposit(input: string): number {
  const value = Number(input);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

/** Busca el último mensaje del cliente de la primera propuesta con actividad. */
export function findClientActivity(quotes: Quote[]): { quote: Quote; message: NonNullable<Quote['messages']>[number] } | null {
  for (const quote of quotes) {
    const lastClientMessage = [...(quote.messages || [])]
      .reverse()
      .find(message => message.from === 'client');
    if (lastClientMessage) return { quote, message: lastClientMessage };
  }
  return null;
}
