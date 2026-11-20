import type { Quote } from '../quotes/types';
import type { EditQuoteField } from './shared/editor-types';
import { BookOpen, AlignJustify, ExternalLink } from 'lucide-react';
import Proposal from '../client/Proposal';
import FlipMagazine from '../magazine/FlipMagazine';
import './quote-publish.css';

type Props = {
  item: Quote;
  styleName: string;
  edit: EditQuoteField;
  openClientPreview: () => void;
};

/** One real document preview in the final stage, no simulated sending action. */
export default function QuotePublishPanel({ item, styleName, edit, openClientPreview }: Props) {
  const mode = item.readingMode === 'scroll' ? 'scroll' : 'flip';
  return (
    <section className="hn-publish">
      <div className="hn-publish-head">
        <h3>Vista final</h3>
        <div className="hn-publish-mode" role="group" aria-label="Modo de lectura de la propuesta">
          <button type="button" className={mode === 'flip' ? 'selected' : ''}
            aria-pressed={mode === 'flip'} onClick={() => edit('readingMode', 'flip')}>
            <BookOpen size={17}/> Revista 3D
          </button>
          <button type="button" className={mode === 'scroll' ? 'selected' : ''}
            aria-pressed={mode === 'scroll'} onClick={() => edit('readingMode', 'scroll')}>
            <AlignJustify size={17}/> Scroll
          </button>
        </div>
      </div>
      <div className={'hn-publish-document hn-style-' + styleName}>
        {mode === 'flip'
          ? <FlipMagazine item={item}/>
          : <Proposal item={item} styleName={styleName} embedded/>}
      </div>
      <button type="button" className="hn-publish-open" onClick={openClientPreview}>
        <ExternalLink size={17}/> Ver a pantalla completa
      </button>
    </section>
  );
}
