/** Datos exclusivamente ficticios de la versión demostrativa. */
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
  status: string;
  cover: string;
  font: string;
  color: string;
  note: string;
  package: string;
  desc: string;
  messages?: QuoteMessage[];
  style?: string;
  readingMode?: string;
};
