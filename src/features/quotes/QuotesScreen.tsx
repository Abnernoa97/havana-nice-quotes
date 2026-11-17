import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { Search, ArrowUpRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import './quotes-trash.css';
import { money, dDate } from '../../shared/lib/formatters';
import type { Quote } from './types';
import { filterQuotes, QUOTE_FILTERS, quoteDisplayName, quoteDisplayStatus } from './model';

type Props = {
  quotes: Quote[];
  btnQuote: ReactNode;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
  selectQuote: (id: string, target?: string) => void;
  statusClass: (status: string) => string;
  moveToTrash: (id: string) => void;
};

/** Sección extraída sin modificar la interfaz ni las acciones del prototipo. */
export default function QuotesScreen({
  quotes,
  btnQuote,
  search,
  setSearch,
  filter,
  setFilter,
  selectQuote,
  statusClass,
  moveToTrash,
}: Props) {
  const visibleQuotes = filterQuotes(quotes, filter, search);
  return (
    <div className="page">
      <div className="intro-line">
        <div>
          <span className="eyebrow">YOUR QUOTES</span>
          <h1>Cotizaciones</h1>
          <p>
            Todas tus propuestas en un mismo lugar, sin perder ningún detalle.
          </p>
        </div>
        {btnQuote}
      </div>
      <div className="panel quotes-panel">
        <div className="list-actions">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar por nombre, pareja o destino..."
              aria-label="Buscar cotizaciones"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="filters">
          {QUOTE_FILTERS.map(
            s => (
              <button
                className={filter === s ? 'filter active' : 'filter'}
                onClick={() => setFilter(s)}
                key={s}
              >
                {s}
              </button>
            )
          )}
        </div>
        <div className="table-header">
          <span>COTIZACIÓN / DESTINO</span>
          <span>FECHA</span>
          <span>INVERSIÓN</span>
          <span>ESTADO</span>
          <span></span>
        </div>
        {visibleQuotes.map(q => (
          <div key={q.id} className="hn-quote-row">
            <button type="button" className="quote-line" onClick={() => selectQuote(q.id)}>
              <div className="table-couple">
                {q.cover ? <img src={q.cover} alt="" /> : <span className="quote-cover-empty" aria-hidden="true"><ImageIcon size={19}/></span>}
                <div>
                  <strong>{quoteDisplayName(q)}</strong>
                  <small>{q.name && q.quoteTitle ? q.name+' · ' : ''}{q.location}</small>
                </div>
              </div>
              <span className="table-date">{dDate(q.date)}</span>
              <span className="table-price">{money(q.price, q.currency)}</span>
              <span>
                <i className={'pill ' + statusClass(q.status)}>{quoteDisplayStatus(q.status)}</i>
              </span>
              <ArrowUpRight size={17} />
            </button>
            <button type="button" className="hn-quote-trash-action"
              aria-label={'Enviar a papelera la cotización ' + quoteDisplayName(q)}
              title="Enviar a papelera" onClick={() => moveToTrash(q.id)}>
              <Trash2 size={17}/>
            </button>
          </div>
        ))}
        {visibleQuotes.length === 0 && (
          <div className="empty">No hay cotizaciones con esos filtros.</div>
        )}
      </div>
    </div>
  );
}
