import type { ReactNode } from 'react';
import {
  FileText,
  Send,
  Clock3,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

type HomeQuote = {
  id: string;
  cover: string;
  name: string;
  location: string;
  status: string;
};

type Props = {
  quotes: HomeQuote[];
  btnQuote: ReactNode;
  addQuote: () => void;
  navigate: (section: string) => void;
  selectQuote: (id: string, target?: string) => void;
  statusClass: (status: string) => string;
};

/** Panel Inicio del prototipo. Conserva el JSX y las acciones originales. */
export default function HomeScreen({
  quotes,
  btnQuote,
  addQuote,
  navigate,
  selectQuote,
  statusClass,
}: Props) {
  return (
    <div className="page dashboard">
      <div className="intro-line">
        <div>
          <span className="eyebrow">THURSDAY, OCTOBER 15, 2026</span>
          <h1>
            Good evening, Fer & Noa <span className="handwave">✳</span>
          </h1>
          <p>
            Todo lo que necesitas para crear propuestas que se sientan
            personales.
          </p>
        </div>
        {btnQuote}
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
            Crear nueva propuesta <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
      <div className="stats">
        {[
          { num: quotes.length, name: 'Cotizaciones', icon: FileText },
          {
            num: quotes.filter(q => q.status === 'Enviada').length,
            name: 'Enviadas',
            icon: Send,
          },
          {
            num: quotes.filter(q => q.status === 'En revisión').length,
            name: 'En revisión',
            icon: Clock3,
          },
          {
            num: quotes.filter(q => q.status === 'Aceptada').length,
            name: 'Aceptadas',
            icon: CheckCircle2,
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
          {quotes.slice(0, 3).map(q => (
            <button
              className="recent-row"
              key={q.id}
              onClick={() => selectQuote(q.id)}
            >
              <img src={q.cover} />
              <div>
                <strong>{q.name}</strong>
                <small>{q.location}</small>
              </div>
              <span className={'pill ' + statusClass(q.status)}>
                {q.status}
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
            Los mensajes que recibas en el futuro aparecerán aquí en tiempo
            real.
          </p>
          <div className="note-box">
            <div className="note-avatar">O</div>
            <div>
              <strong>Olivia & James</strong>
              <p>“Can we add music for our welcome party too?”</p>
              <button onClick={() => selectQuote('hn1', 'messages')}>
                Abrir conversación <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
