import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { Download, Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { usd, dDate } from '../../shared/lib/formatters';
import type { Quote } from './types';

type Props = {
  quotes: Quote[];
  btnQuote: ReactNode;
  downloadQuoteBackup: () => void;
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
  downloadQuoteBackup,
  search,
  setSearch,
  filter,
  setFilter,
  selectQuote,
  statusClass,
}: Props) {
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
        <div className="hn-backup-actions">
          <button type="button" className="btn subtle hn-backup-btn" onClick={downloadQuoteBackup}>
            <Download size={16} /> Respaldar datos
          </button>
          {btnQuote}
        </div>
      </div>
      <div className="panel quotes-panel">
        <div className="list-actions">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar por pareja o destino..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn">
            <SlidersHorizontal size={16} /> Filtrar
          </button>
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
        {quotes
          .filter(
            q =>
              (filter === 'Todas' || q.status === filter) &&
              [q.name, q.location]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
          )
          .map(q => (
            <button
              className="quote-line"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              <div className="table-couple">
                <img src={q.cover} />
                <div>
                  <strong>{q.name}</strong>
                  <small>{q.location}</small>
                </div>
              </div>
              <span className="table-date">{dDate(q.date)}</span>
              <span className="table-price">{usd(q.price)}</span>
              <span>
                <i className={'pill ' + statusClass(q.status)}>{q.status}</i>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        {quotes.filter(
          q =>
            (filter === 'Todas' || q.status === filter) &&
            [q.name, q.location]
              .join(' ')
              .toLowerCase()
              .includes(search.toLowerCase())
        ).length === 0 && (
          <div className="empty">No hay cotizaciones con esos filtros.</div>
        )}
      </div>
    </div>
  );
}
