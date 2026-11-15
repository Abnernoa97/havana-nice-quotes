import type { QuoteCurrency } from '../../shared/lib/formatters';

/** Datos de las cotizaciones, compartidos entre el estudio y la nube. */
export type QuoteStatus = 'Borrador' | 'Enviada' | 'En revisión' | 'Aceptada';
export type QuoteStyle = 'libre' | 'vogue' | 'lane' | 'junebug' | 'nyt';
export type ReadingMode = 'flip' | 'scroll';
export type QuoteMessage = { from: string; text: string; time: string };
export type Quote = {
  id: string;
  name: string;
  client: string;
  email: string;
  location: string;
  date: string;
  price: number;
  deposit: number;
  currency?: QuoteCurrency;
  status: QuoteStatus;
  cover: string;
  font: string;
  color: string;
  note: string;
  package: string;
  desc: string;
  messages?: QuoteMessage[];
  style?: QuoteStyle;
  readingMode?: ReadingMode;
};
