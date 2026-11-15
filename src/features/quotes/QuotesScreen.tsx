import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { Search, ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import { money, dDate } from '../../shared/lib/formatters';
import type { Quote } from './types';
import { filterQuotes } from './model';

type Props = {
  quotes: Quote[];
  btnQuote: ReactNode;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
  selectQuote: (id: string, target?: string) => void;
  statusClass: (status: string) => string;
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
              placeholder="Buscar por pareja o destino..."
              aria-label="Buscar cotizaciones"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="filters">
          {['Todas', 'Borrador', 'Enviada', 'En revisión', 'Aceptada'].map(
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
          <span>PAREJA / DESTINO</span>
          <span>FECHA</span>
          <span>INVERSIÓN</span>
          <span>ESTADO</span>
          <span></span>
        </div>
        {visibleQuotes.map(q => (
            <button
              className="quote-line"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              <div className="table-couple">
                {q.cover ? <img src={q.cover} alt="" /> : <span className="quote-cover-empty" aria-hidden="true"><ImageIcon size={19}/></span>}
                <div>
                  <strong>{q.name}</strong>
                  <small>{q.location}</small>
                </div>
              </div>
              <span className="table-date">{dDate(q.date)}</span>
              <span className="table-price">{money(q.price, q.currency)}</span>
              <span>
                <i className={'pill ' + statusClass(q.status)}>{q.status}</i>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        {visibleQuotes.length === 0 && (
          <div className="empty">No hay cotizaciones con esos filtros.</div>
        )}
      </div>
    </div>
  );
}
