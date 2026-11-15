import type { CSSProperties } from 'react';
import type { Quote } from '../quotes/types';
import { quoteCurrency, usd } from '../../shared/lib/formatters';
import './carolina-template.css';

/** The three original Canva pages. All visible content is rendered as real HTML. */
export const CAROLINA_SLOTS = 6;

export const CAROLINA_COPY = {
  performance: '',
  musicians: '',
  crew: '',
  backline: '',
  logistics: '',
  balance: '',
  production: '',
  connections: '',
  space: '',
} as const;

export type CarolinaCopy = { [K in keyof typeof CAROLINA_COPY]: string };

export function carolinaCopy(item: Quote): CarolinaCopy {
  return { ...CAROLINA_COPY, ...item.carolinaCopy };
}

export function carolinaPhotos(item: Quote): string[] {
  return Array.from({ length: CAROLINA_SLOTS }, (_, i) => item.gallery?.[i] || '');
}

export function carolinaDate(value: string): string {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value + 'T12:00:00');
  return Number.isFinite(date.valueOf())
    ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', '')
    : 'Date to be confirmed';
}

export function carolinaInvestment(item: Quote): string {
  return usd(item.price) + (quoteCurrency(item.currency) === 'MX' ? ' Mexican Pesos' : ' USD');
}

export function CarolinaCover({ item }: { item: Quote }) {
  const style: CSSProperties = item.cover
    ? { backgroundImage: 'linear-gradient(180deg,rgba(20,15,13,.33),rgba(20,15,13,.09) 55%,rgba(20,15,13,.42)),url("' + item.cover + '")' }
    : {};
  return (
    <div className="hn-carolina-page hn-carolina-cover" style={style}>
      <div className="hn-carolina-cover-brand">
        <strong>HAVANA NICE</strong>
        <span>Live Wedding Music</span>
      </div>
    </div>
  );
}

function PhotoCell({ url, position }: { url: string; position: number }) {
  return (
    <div className={'hn-carolina-photo hn-carolina-photo-' + position}
      role="img" aria-label={url ? 'Wedding photograph ' + position : 'Photograph slot ' + position}
      style={url ? { backgroundImage: 'url("' + url + '")' } : undefined}/>
  );
}

export function CarolinaCollage({ item }: { item: Quote }) {
  const images = carolinaPhotos(item);
  return (
    <div className="hn-carolina-page hn-carolina-collage">
      <div className="hn-carolina-photo-column left">
        {images.slice(0, 2).map((url, i) => <PhotoCell key={i} url={url} position={i + 1}/>)}
      </div>
      <div className="hn-carolina-photo-column right">
        {images.slice(2).map((url, i) => <PhotoCell key={i + 2} url={url} position={i + 3}/>)}
      </div>
    </div>
  );
}

export function CarolinaTerms({ item }: { item: Quote }) {
  const copy = carolinaCopy(item);
  return (
    <div className="hn-carolina-page hn-carolina-terms">
      <section className="hn-carolina-term-group celebration">
        <h2>The Celebration</h2>
        <div className="hn-carolina-term-lines">
          <p>Date: {carolinaDate(item.date)}</p>
          <p>The setting: {item.location}</p>
        </div>
      </section>
      <section className="hn-carolina-term-group experience">
        <h2>The Experience</h2>
        <div className="hn-carolina-term-lines">
          <p>Performance: {copy.performance}</p>
          <p>On Stage: {copy.musicians}</p>
          <p>Our Crew: {copy.crew}</p>
          <p>Includes full backline: {copy.backline}.</p>
          <p>Investment: {carolinaInvestment(item)}</p>
          <p>{copy.logistics}</p>
          <p>To secure your date, we require a {item.deposit}% deposit and a signed agreement. {copy.balance}</p>
        </div>
      </section>
      <section className="hn-carolina-term-group production">
        <h2>Production &amp; Tech</h2>
        <div className="hn-carolina-term-lines">
          <p>• AV Production: {copy.production}</p>
          <p>• {copy.connections}</p>
          <p>• Space: {copy.space}</p>
        </div>
      </section>
    </div>
  );
}

/** The 3 original PDF pages, in reading order. */
export default function CarolinaDocument({ item }: { item: Quote }) {
  return (
    <div className="hn-carolina-document">
      <CarolinaCover item={item}/>
      <CarolinaCollage item={item}/>
      <CarolinaTerms item={item}/>
    </div>
  );
}

/** A plain unprinted reverse side, required to pair physical 3D book leaves. */
export function CarolinaBlankReverse() {
  return <div className="hn-carolina-page hn-carolina-reverse" aria-label="Contraportada sin impresión"/>;
}
