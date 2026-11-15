import { Check } from 'lucide-react';
import { money, dDate } from '../../shared/lib/formatters';
import type { Quote } from '../quotes/types';
import { coverBackground } from '../../shared/lib/coverBackground';
import CarolinaDocument from '../templates/CarolinaTemplate';

type Props = { item: Quote; styleName: string; embedded?: boolean };

/** Mismo JSX que el prototipo original, sin rediseños. */
export default function Proposal({ item, styleName, embedded = false }: Props) {
  if (styleName === 'carolina') {
    return <CarolinaDocument item={item}/>;
  }
  return (
    <div className={'proposal hn-style-' + styleName + ' ' + (embedded ? 'embedded' : '')}>
      <div className="proposal-top">
        <span>HAVANA NICE</span>
        <small>LIVE MUSIC · MEXICO</small>
      </div>
      <div
        className="proposal-photo"
        style={{
          backgroundImage: coverBackground(item.cover,
            'linear-gradient(180deg,rgba(10,24,20,.04) 16%,rgba(10,24,20,.33) 60%,rgba(10,24,20,.67))'),
        }}
      >
        <div className="hero-content">
          <div className="eyebrow light">A PERSONAL PROPOSAL FOR</div>
          <h2 className={item.font === 'modern' ? 'modern' : ''}>
            {item.name}
          </h2>
          <div className="little-line" />
          <p>{item.note}</p>
          <small>
            {item.location} · {dDate(item.date)}
          </small>
        </div>
      </div>
      <div className="paper-content">
        <div className="paper-eyebrow">01 / THE EXPERIENCE</div>
        <h3>
          Beautiful moments.
          <br />
          <em>Real live music.</em>
        </h3>
        <p>{item.desc}</p>
        <div className="paper-rule" />
        <div className="package-intro">
          <span>YOUR EXPERIENCE</span>
          <strong>{item.package}</strong>
        </div>
        <div className="packages">
          <div>
            <Check size={16} /> Live musicians, playing together
          </div>
          <div>
            <Check size={16} /> Curated music for your celebration
          </div>
          <div>
            <Check size={16} /> Personal planning with Fer & Noa
          </div>
        </div>
        <div className="paper-rule" />
        <div className="price-row">
          <div>
            <small>TOTAL PROPOSAL</small>
            <strong>{money(item.price, item.currency)}</strong>
          </div>
          <div>
            <small>TO RESERVE · {item.deposit}%</small>
            <strong>{money((item.price * item.deposit) / 100, item.currency)}</strong>
          </div>
        </div>
        <div className="paper-end">
          With love & care,<strong>Fer & Noa</strong>
          <small>HAVANA NICE</small>
        </div>
      </div>
    </div>
  );
}
