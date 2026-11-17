import { formatHomeDate, homeGreeting } from './greeting';
import { Image as ImageIcon } from 'lucide-react';
import { findClientActivity, quoteDisplayName, quoteDisplayStatus } from '../quotes/model';
import type { Quote } from '../quotes/types';
import {
  FileText,
  Send,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  Plus,
  MessageCircle,
} from 'lucide-react';

type Props = {
  quotes: Quote[];
  addQuote: () => void;
  navigate: (section: string) => void;
  selectQuote: (id: string, target?: string) => void;
  statusClass: (status: string) => string;
};

/** Panel Inicio del prototipo. Conserva el JSX y las acciones originales. */
export default function HomeScreen({
  quotes,
  addQuote,
  navigate,
  selectQuote,
  statusClass,
}: Props) {
  const today = new Date();
  const clientActivity = findClientActivity(quotes);
  return (
    <div className="page dashboard">
      <div className="intro-line">
        <div>
          <span className="eyebrow">{formatHomeDate(today)}</span>
          <h1>
            {homeGreeting(today)}, Fer & Noa <span className="handwave">✳</span>
          </h1>
        </div>
      </div>
      <div className="welcome-hero">
        <div className="hero-shade">
          <span className="eyebrow light">HAVANA NICE · QUOTES STUDIO</span>
          <h2>
            Every beautiful
            <br />
            celebration starts
            <br />
            <em>with a conversation.</em>
          </h2>
          <p>Diseña, comparte y conecta con cada pareja desde un solo lugar.</p>
          <button onClick={addQuote} className="btn ivory">
            <Plus size={17} /> Nueva cotización
          </button>
        </div>
      </div>
      <div className="stats">
        {[
          { num: quotes.length, name: 'Cotizaciones', icon: FileText },
          {
            num: quotes.filter(q => ['Enviada','En revisión','Aceptada'].includes(q.status)).length,
            name: 'Enviadas',
            icon: Send,
          },
          {
            num: quotes.filter(q => q.status === 'Borrador').length,
            name: 'Borrador',
            icon: Clock3,
          },
          {
            num: quotes.filter(q => q.status === 'Lista para enviar').length,
            name: 'Listas para enviar',
            icon: Clock3,
          },
        ].map((s, i) => (
          <div className="stat" key={i}>
            <s.icon size={20} />
            <div>
              <strong>{String(s.num).padStart(2, '0')}</strong>
              <span>{s.name}</span>
            </div>
            <ArrowUpRight className="stat-arrow" size={15} />
          </div>
        ))}
      </div>
      <div className="home-bottom">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">YOUR WORK</span>
              <h3>Propuestas recientes</h3>
            </div>
            <button className="text-btn" onClick={() => navigate('quotes')}>
              Ver todas <ArrowRight size={15} />
            </button>
          </div>
          {!quotes.length && <p className="panel-intro">Todavía no hay propuestas. Tu primera cotización aparecerá cuando elijas Guardar.</p>}
          {quotes.slice(0, 3).map(q => (
            <button
              className="recent-row"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              {q.cover ? <img src={q.cover} alt="" /> : <span className="quote-cover-empty" aria-hidden="true"><ImageIcon size={19}/></span>}
              <div>
                <strong>{quoteDisplayName(q)}</strong>
                <small>{q.name && q.quoteTitle ? q.name+' · ' : ''}{q.location}</small>
              </div>
              <span className={'pill ' + statusClass(q.status)}>
                {quoteDisplayStatus(q.status)}
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div className="panel next-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">CLIENT ACTIVITY</span>
              <h3>En conversación</h3>
            </div>
            <MessageCircle size={19} />
          </div>
          <p className="panel-intro">
            Aquí aparecen los mensajes de prueba de tus propuestas.
          </p>
          {clientActivity ? (
            <div className="note-box">
              <div className="note-avatar">{(clientActivity.quote.name || '?')[0]}</div>
              <div>
                <strong>{clientActivity.quote.name}</strong>
                <p>“{clientActivity.message.text}”</p>
                <button onClick={() => selectQuote(clientActivity.quote.id, 'messages')}>
                  Abrir conversación <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <p className="panel-intro">Todavía no hay mensajes de prueba.</p>
          )}
        </div>
      </div>
    </div>
  );
}
