import type { Quote } from '../quotes/types';
import type { CarolinaTextInteraction } from './CarolinaTextNode';
import CarolinaTextNode from './CarolinaTextNode';
import CarolinaPhotoNode from './CarolinaPhotoNode';
import CoverMediaNode from './CoverMediaNode';
import CoverAddPrompt from './CoverAddPrompt';
import type { CarolinaFixedKey } from './carolina-layout';
import { fixedText, carolinaPhotoOrder, carolinaPageOrder, CAROLINA_MAX_SLOTS, isBlankPage } from './carolina-layout';
import { quoteCurrency, usd } from '../../shared/lib/formatters';
import './carolina-template.css';

/** Original three-page composition; all typography is rendered from editable data. */
export const CAROLINA_SLOTS = 6;
export const CAROLINA_COPY = {
  performance: '', musicians: '', crew: '', backline: '', logistics: '',
  balance: '', production: '', connections: '', space: '',
} as const;
export type CarolinaCopy = { [K in keyof typeof CAROLINA_COPY]: string };
export function carolinaCopy(item: Quote): CarolinaCopy {
  return { ...CAROLINA_COPY, ...item.carolinaCopy };
}
export function carolinaPhotos(item: Quote): string[] {
  return Array.from({ length: CAROLINA_MAX_SLOTS }, (_, i) => item.gallery?.[i] || '');
}
export function carolinaDate(value: string): string {
  if (!value) return '';
  const date = new Date(value + 'T12:00:00');
  return Number.isFinite(date.valueOf())
    ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', '')
    : '';
}
export function carolinaInvestment(item: Quote): string {
  return usd(item.price) + (quoteCurrency(item.currency) === 'MX' ? ' Mexican Pesos' : ' USD');
}
type PageProps = { item: Quote; interaction?: CarolinaTextInteraction };
type FieldNodeProps = PageProps & { field: string; value: string; instance?: 'cover' };
function FieldNode({ item, field, value, interaction, instance }: FieldNodeProps) {
  const id = 'field:' + field + (instance ? ':' + instance : '');
  return <CarolinaTextNode id={id} text={value}
    transform={item.designLayout?.transforms?.[id]}
    fontId={item.designLayout?.fonts?.[id] || item.designLayout?.defaultFont}
    textStyle={item.designLayout?.textStyles?.[id]}
    interaction={interaction}/>;
}
function FixedNode({ item, field, interaction }: PageProps & { field: CarolinaFixedKey }) {
  const id = 'fixed:' + field;
  return <CarolinaTextNode id={id} text={fixedText(item.designLayout, field)}
    transform={item.designLayout?.transforms?.[id]}
    fontId={item.designLayout?.fonts?.[id] || item.designLayout?.defaultFont}
    textStyle={item.designLayout?.textStyles?.[id]}
    interaction={interaction}/>;
}
export function ExtraTexts({ item, page, interaction }: PageProps & { page: number }) {
  const entries = item.designLayout?.extras?.filter(e => e.page === page) || [];
  if (!entries.length) return null;
  return (
    <div className="hn-carolina-extra-layer">
      {entries.map(extra => {
        const id = 'extra:' + extra.id;
        return <div className="hn-carolina-added-text" key={extra.id}>
          <CarolinaTextNode id={id} text={extra.text} extra
            transform={item.designLayout?.transforms?.[id]}
            fontId={item.designLayout?.fonts?.[id] || item.designLayout?.defaultFont}
            textStyle={item.designLayout?.textStyles?.[id]}
            interaction={interaction}/>
        </div>;
      })}
    </div>
  );
}
/** Additional photo layers belong to an individual page, not to the fixed collage grid. */
export function ExtraPhotos({ item, page, interaction, onSelectPhoto }: PageProps & {
  page: number; onSelectPhoto?: (id:string)=>void;
}) {
  const photos=item.designLayout?.extraPhotos?.filter(p=>p.page===page&&!!p.url)||[];
  if (!photos.length) return null;
  return <div className="hn-carolina-photo-overlay">
    {photos.map((photo,index)=>{
      const id='photo-extra:'+photo.id;
      // The first real medium on each free page is always its full-page backdrop.
      // Older saved templates get the same layout without migrating stored data.
      const pageBackground=isBlankPage(page)&&index===0;
      return <CarolinaPhotoNode key={id} id={id} url={photo.url} extra pageBackground={pageBackground}
        transform={item.designLayout?.transforms?.[id]}
        photoStyle={item.designLayout?.photoStyles?.[id]}
        interaction={interaction}
        onSelect={onSelectPhoto ? ()=>onSelectPhoto(photo.id) : undefined}/>;
    })}
  </div>;
}
export function CarolinaCover({ item, interaction, onSelectCover, onSelectExtraPhoto }: PageProps & {
  onSelectCover?: () => void;
  onSelectExtraPhoto?: (id:string)=>void;
}) {
  return (
    <div className={'hn-carolina-page hn-carolina-cover' +
      (interaction?.transformingId ? ' hn-layout-grid' : '')}>
      <CoverMediaNode item={item} interaction={interaction} onSelect={onSelectCover}/>
      <div className="hn-carolina-cover-brand">
        <strong><FixedNode item={item} field="brand" interaction={interaction}/></strong>
        <span><FixedNode item={item} field="subtitle" interaction={interaction}/></span>
      </div>
      {(interaction || item.name || item.note || item.location || item.date) && (
        <div className="hn-carolina-cover-personal">
          <h2><FieldNode item={item} field="name" value={item.name} interaction={interaction}/></h2>
          <p><FieldNode item={item} field="note" value={item.note} interaction={interaction}/></p>
          <small>
            <FieldNode item={item} field="location" instance="cover" value={item.location} interaction={interaction}/>
            {(item.location && item.date) && <span aria-hidden="true"> · </span>}
            <FieldNode item={item} field="date" instance="cover"
              value={carolinaDate(item.date)} interaction={interaction}/>
          </small>
        </div>
      )}
      <CoverAddPrompt onAdd={onSelectCover} occupied={Boolean(item.cover || item.coverVideo)}/>
      <ExtraPhotos item={item} page={0} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
      <ExtraTexts item={item} page={0} interaction={interaction}/>
    </div>
  );
}
export function CarolinaCollage({ item, onSelectPhoto, interaction, onSelectExtraPhoto }: PageProps & {
  onSelectPhoto?: (index: number) => void;
  onSelectExtraPhoto?: (id:string)=>void;
}) {
  const images = carolinaPhotos(item);
  const order = carolinaPhotoOrder(item.designLayout);
  const leftCount = order.length === CAROLINA_SLOTS ? 2 : Math.ceil(order.length / 2);
  const left = order.slice(0, leftCount);
  const right = order.slice(leftCount);
  return (
    <div className={'hn-carolina-page hn-carolina-collage' +
      (order.length === CAROLINA_SLOTS ? ' original-six' : ' flexible-collage') +
      (interaction?.transformingId ? ' hn-layout-grid' : '')}>
      <div className="hn-carolina-photo-column left">
        {left.map((slot, i) => <CarolinaPhotoNode key={slot} id={'photo:' + slot}
          url={images[slot]} position={i + 1}
          transform={item.designLayout?.transforms?.['photo:' + slot]}
          photoStyle={item.designLayout?.photoStyles?.['photo:' + slot]}
          interaction={interaction} onSelect={onSelectPhoto ? () => onSelectPhoto(slot) : undefined}/>)}
      </div>
      <div className="hn-carolina-photo-column right">
        {right.map((slot, i) => <CarolinaPhotoNode key={slot} id={'photo:' + slot}
          url={images[slot]} position={leftCount + i + 1}
          transform={item.designLayout?.transforms?.['photo:' + slot]}
          photoStyle={item.designLayout?.photoStyles?.['photo:' + slot]}
          interaction={interaction} onSelect={onSelectPhoto ? () => onSelectPhoto(slot) : undefined}/>)}
      </div>
      <ExtraPhotos item={item} page={1} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
      <ExtraTexts item={item} page={1} interaction={interaction}/>
    </div>
  );
}
export function CarolinaTerms({ item, interaction, onSelectExtraPhoto }: PageProps & {onSelectExtraPhoto?: (id:string)=>void}) {
  const copy = carolinaCopy(item);
  return (
    <div className={'hn-carolina-page hn-carolina-terms' +
      (interaction?.transformingId ? ' hn-layout-grid' : '')}>
      <section className="hn-carolina-term-group celebration">
        <h2><FixedNode item={item} field="celebration" interaction={interaction}/></h2>
        <div className="hn-carolina-term-lines">
          <p><FixedNode item={item} field="date" interaction={interaction}/>
            <FieldNode item={item} field="date" value={carolinaDate(item.date)} interaction={interaction}/></p>
          <p><FixedNode item={item} field="venue" interaction={interaction}/>
            <FieldNode item={item} field="location" value={item.location} interaction={interaction}/></p>
        </div>
      </section>
      <section className="hn-carolina-term-group experience">
        <h2><FixedNode item={item} field="experience" interaction={interaction}/></h2>
        <div className="hn-carolina-term-lines">
          {(interaction || item.package) && <p><FixedNode item={item} field="service" interaction={interaction}/>
            <FieldNode item={item} field="package" value={item.package} interaction={interaction}/></p>}
          {(interaction || item.desc) && <p><FieldNode item={item} field="desc" value={item.desc}
            interaction={interaction}/></p>}
          <p><FixedNode item={item} field="performance" interaction={interaction}/>
            <FieldNode item={item} field="performance" value={copy.performance} interaction={interaction}/></p>
          <p><FixedNode item={item} field="musicians" interaction={interaction}/>
            <FieldNode item={item} field="musicians" value={copy.musicians} interaction={interaction}/></p>
          <p><FixedNode item={item} field="crew" interaction={interaction}/>
            <FieldNode item={item} field="crew" value={copy.crew} interaction={interaction}/></p>
          <p><FixedNode item={item} field="backline" interaction={interaction}/>
            <FieldNode item={item} field="backline" value={copy.backline} interaction={interaction}/></p>
          <p><FixedNode item={item} field="investment" interaction={interaction}/>
            <FieldNode item={item} field="price"
              value={item.price ? carolinaInvestment(item) : ''} interaction={interaction}/></p>
          <p><FieldNode item={item} field="logistics" value={copy.logistics} interaction={interaction}/></p>
          <p><FixedNode item={item} field="depositBefore" interaction={interaction}/>
            <FieldNode item={item} field="deposit"
              value={item.deposit ? String(item.deposit) + '%' : ''} interaction={interaction}/>
            <FixedNode item={item} field="depositAfter" interaction={interaction}/>
            <FieldNode item={item} field="balance" value={copy.balance} interaction={interaction}/></p>
        </div>
      </section>
      <section className="hn-carolina-term-group production">
        <h2><FixedNode item={item} field="production" interaction={interaction}/></h2>
        <div className="hn-carolina-term-lines">
          <p><FixedNode item={item} field="av" interaction={interaction}/>
            <FieldNode item={item} field="production" value={copy.production} interaction={interaction}/></p>
          <p><FixedNode item={item} field="bullet" interaction={interaction}/>
            <FieldNode item={item} field="connections" value={copy.connections} interaction={interaction}/></p>
          <p><FixedNode item={item} field="space" interaction={interaction}/>
            <FieldNode item={item} field="space" value={copy.space} interaction={interaction}/></p>
        </div>
      </section>
      <ExtraPhotos item={item} page={2} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
      <ExtraTexts item={item} page={2} interaction={interaction}/>
    </div>
  );
}
/** Real blank canvas: no inherited text, title, masthead or collage. */
export function CarolinaBlankPage({item,page,interaction,onSelectExtraPhoto}:PageProps & {
 page:number;onSelectExtraPhoto?:(id:string)=>void;
}) {
 return <div className={'hn-carolina-page hn-blank-page' +
    (interaction?.transformingId?' hn-layout-grid':'')}
    aria-label={'Página en blanco '+page}>
   <ExtraPhotos item={item} page={page} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
   <ExtraTexts item={item} page={page} interaction={interaction}/>
 </div>;
}
export default function CarolinaDocument({ item }: { item: Quote }) {
  return (
    <div className="hn-carolina-document">
      {carolinaPageOrder(item.designLayout).map(page=>{
        if (page===0) return <CarolinaCover key="cover" item={item}/>;
        if (page===1) return <CarolinaCollage key="collage" item={item}/>;
        if(page===2)return <CarolinaTerms key="terms" item={item}/>;
        return <CarolinaBlankPage key={page} item={item} page={page}/>;
      })}
    </div>
  );
}
export function CarolinaBlankReverse() {
  return <div className="hn-carolina-page hn-carolina-reverse" aria-label="Contraportada sin impresión"/>;
}
