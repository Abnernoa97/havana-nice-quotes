import type { QuoteCurrency } from '../../shared/lib/formatters';
import type { CarolinaCopy } from '../templates/CarolinaTemplate';
import type { CarolinaLayout } from '../templates/carolina-layout';
import type { TemplateStyle } from '../templates/template-registry';

/** Datos de las cotizaciones, compartidos entre el estudio y la nube. */
export type QuoteStatus = 'Borrador' | 'Enviada' | 'En revisión' | 'Aceptada';
export type QuoteStyle = TemplateStyle;
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
  cover: string; // Photo cover or empty when using a video
  coverVideo?: string; // Optional authenticated /api/videos/{id} web cover
  gallery?: string[];
  carolinaCopy?: Partial<CarolinaCopy>;
  designLayout?: CarolinaLayout; // Sole persisted layout for every template
  font: string;
  color: string;
  note: string;
  package: string;
  desc: string;
  messages?: QuoteMessage[];
  style?: QuoteStyle;
  readingMode?: ReadingMode;
};
