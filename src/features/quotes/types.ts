/** Datos exclusivamente ficticios de la versión demostrativa. */
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
