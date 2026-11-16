import type { CSSProperties } from 'react';
import type { Quote } from '../quotes/types';
import type { CarolinaTextField } from './carolina-edit-fields';
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

type OnTextEdit = (field: CarolinaTextField) => void;

/** Same HTML in editor and client; only the edit callback adds on-canvas hotspots. */
function TextHotspot({ field, value, onEditText }: {
  field: CarolinaTextField; value: string; onEditText?: OnTextEdit;
}) {
  if (!onEditText) return <>{value}</>;
  return (
    <button type="button" className={'hn-canvas-inline-text' + (!value ? ' empty' : '')}
      aria-label={'Editar ' + field} onClick={() => onEditText(field)}>
      {value || <span aria-hidden="true">✎</span>}
    </button>
  );
}

export function CarolinaCover({ item, onEditText }: { item: Quote; onEditText?: OnTextEdit }) {
  const style: CSSProperties = item.cover
    ? { backgroundImage: 'linear-gradient(180deg,rgba(20,15,13,.33),rgba(20,15,13,.09) 55%,rgba(20,15,13,.42)),url("' + item.cover + '")' }
    : {};
  return (
    <div className="hn-carolina-page hn-carolina-cover" style={style}>
      <div className="hn-carolina-cover-brand">
        <strong>HAVANA NICE</strong>
        <span>Live Wedding Music</span>
      </div>
      {(onEditText || item.name || item.note || item.location || item.date) && (
        <div className="hn-carolina-cover-personal">
          <h2><TextHotspot field="name" value={item.name} onEditText={onEditText}/></h2>
          <p><TextHotspot field="note" value={item.note} onEditText={onEditText}/></p>
          <small>
            <TextHotspot field="location" value={item.location} onEditText={onEditText}/>
            {(item.location && item.date) && <span aria-hidden="true"> · </span>}
            <TextHotspot field="date" value={item.date ? carolinaDate(item.date) : ''}
              onEditText={onEditText}/>
          </small>
        </div>
      )}
    </div>
  );
}

function PhotoCell({ url, position, onSelect }: {
  url: string; position: number; onSelect?: (index: number) => void;
}) {
  const className = 'hn-carolina-photo hn-carolina-photo-' + position;
  const style = url ? { backgroundImage: 'url("' + url + '")' } : undefined;
  if (onSelect) return (
    <button type="button" className={className + ' hn-carolina-editable-photo'}
      aria-label={'Elegir fotografía del recuadro ' + position}
      onClick={() => onSelect(position - 1)} style={style}>
      {!url && <span className="hn-carolina-empty-photo">+</span>}
      <span className="hn-carolina-photo-index">{String(position).padStart(2, '0')}</span>
    </button>
  );
  return <div className={className} role="img"
    aria-label={url ? 'Wedding photograph ' + position : 'Photograph slot ' + position}
    style={style}/>;
}

export function CarolinaCollage({ item, onSelectPhoto }: {
  item: Quote; onSelectPhoto?: (index: number) => void;
}) {
  const images = carolinaPhotos(item);
  return (
    <div className="hn-carolina-page hn-carolina-collage">
      <div className="hn-carolina-photo-column left">
        {images.slice(0, 2).map((url, i) => <PhotoCell key={i} url={url}
          position={i + 1} onSelect={onSelectPhoto}/>)}
      </div>
      <div className="hn-carolina-photo-column right">
        {images.slice(2).map((url, i) => <PhotoCell key={i + 2} url={url}
          position={i + 3} onSelect={onSelectPhoto}/>)}
      </div>
    </div>
  );
}

export function CarolinaTerms({ item, onEditText }: { item: Quote; onEditText?: OnTextEdit }) {
  const copy = carolinaCopy(item);
  return (
    <div className="hn-carolina-page hn-carolina-terms">
      <section className="hn-carolina-term-group celebration">
        <h2>The Celebration</h2>
        <div className="hn-carolina-term-lines">
          <p>Date: <TextHotspot field="date" value={item.date ? carolinaDate(item.date) : ''}
            onEditText={onEditText}/></p>
          <p>The setting: <TextHotspot field="location" value={item.location}
            onEditText={onEditText}/></p>
        </div>
      </section>
      <section className="hn-carolina-term-group experience">
        <h2>The Experience</h2>
        <div className="hn-carolina-term-lines">
          {(onEditText || item.package) && <p>Service: <TextHotspot field="package" value={item.package}
            onEditText={onEditText}/></p>}
          {(onEditText || item.desc) && <p><TextHotspot field="desc" value={item.desc}
            onEditText={onEditText}/></p>}
          <p>Performance: <TextHotspot field="performance" value={copy.performance} onEditText={onEditText}/></p>
          <p>On Stage: <TextHotspot field="musicians" value={copy.musicians} onEditText={onEditText}/></p>
          <p>Our Crew: <TextHotspot field="crew" value={copy.crew} onEditText={onEditText}/></p>
          <p>Includes full backline: <TextHotspot field="backline" value={copy.backline} onEditText={onEditText}/>.</p>
          <p>Investment: <TextHotspot field="price" value={item.price ? carolinaInvestment(item) : ''} onEditText={onEditText}/></p>
          <p><TextHotspot field="logistics" value={copy.logistics} onEditText={onEditText}/></p>
          <p>To secure your date, we require a <TextHotspot field="deposit"
            value={item.deposit ? String(item.deposit) + '%' : ''} onEditText={onEditText}/>
            {' '}deposit and a signed agreement. <TextHotspot field="balance"
              value={copy.balance} onEditText={onEditText}/></p>
        </div>
      </section>
      <section className="hn-carolina-term-group production">
        <h2>Production &amp; Tech</h2>
        <div className="hn-carolina-term-lines">
          <p>• AV Production: <TextHotspot field="production" value={copy.production}
            onEditText={onEditText}/></p>
          <p>• <TextHotspot field="connections" value={copy.connections} onEditText={onEditText}/></p>
          <p>• Space: <TextHotspot field="space" value={copy.space} onEditText={onEditText}/></p>
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
