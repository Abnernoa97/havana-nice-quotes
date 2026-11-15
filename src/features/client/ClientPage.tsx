import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, Check, MessageCircle, CheckCircle2, Heart } from 'lucide-react';
import { usd } from '../../shared/lib/formatters';
import type { Quote } from '../quotes/types';

type Props = {
  item: Quote;
  styleName: string;
  setPreview: Dispatch<SetStateAction<boolean>>;
  clientMessage: string;
  setClientMessage: Dispatch<SetStateAction<string>>;
  sendClient: () => void;
  viewAccept: boolean;
  setViewAccept: Dispatch<SetStateAction<boolean>>;
  updateStatus: (status: string) => void;
};

/** Mismo JSX que el prototipo original, sin rediseños. */
export default function ClientPage({
  item,
  styleName,
  setPreview,
  clientMessage,
  setClientMessage,
  sendClient,
  viewAccept,
  setViewAccept,
  updateStatus,
}: Props) {
  return (
    <div className={'client-app hn-style-' + styleName}>
      <div className="client-navbar">
        <div className="client-brand">
          HAVANA NICE <small>LIVE MUSIC FOR YOUR WEDDING</small>
        </div>
        <button onClick={() => setPreview(false)} className="close-preview">
          <ChevronLeft size={17} /> Volver al editor
        </button>
      </div>
      <div
        className="client-hero"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(19,35,30,.48),rgba(19,35,30,.05)),url(' +
            item.cover +
            ')',
        }}
      >
        <div>
          <span className="eyebrow light">
            CURATED WITH CARE · MADE JUST FOR YOU
          </span>
          <h1>{item.name}</h1>
          <p>{item.note}</p>
        </div>
      </div>
      <div className="client-layout">
        <div className="client-story">
          <span className="eyebrow">HAVANA NICE · YOUR CELEBRATION</span>
          <h2>
            We would love to
            <br />
            <em>be part of your day.</em>
          </h2>
          <p>{item.desc}</p>
          <div className="client-divider" />
          <span className="eyebrow">YOUR LIVE MUSIC EXPERIENCE</span>
          <h3>{item.package}</h3>
          <div className="client-inclusions">
            <p>
              <Check size={17} /> Live musicians, no backing tracks
            </p>
            <p>
              <Check size={17} /> Music selected around your celebration
            </p>
            <p>
              <Check size={17} /> Personal planning with Fer & Noa
            </p>
          </div>
          <div className="client-divider" />
          <div className="client-total">
            <div>
              <small>TOTAL INVESTMENT</small>
              <strong>{usd(item.price)}</strong>
            </div>
            <div>
              <small>{item.deposit}% RESERVATION DEPOSIT</small>
              <strong>{usd((item.price * item.deposit) / 100)}</strong>
            </div>
          </div>
          <small className="tiny">
            Demonstration only. This is not a formal quote, agreement, or
            payment request.
          </small>
        </div>
        <div className="client-actions">
          <div className="client-card">
            <span className="eyebrow">LET'S TALK</span>
            <h3>Have a question?</h3>
            <p>
              Tell us what you're imagining. We can adjust the proposal
              together.
            </p>
            <textarea
              placeholder="Hi Fer & Noa! We'd love to ask..."
              rows={4}
              value={clientMessage}
              onChange={e => setClientMessage(e.target.value)}
            />
            <button className="btn primary full" onClick={sendClient}>
              <MessageCircle size={16} /> Send a sample message
            </button>
          </div>
          <div className="client-card">
            <span className="eyebrow">NEXT STEP</span>
            <h3>Love what you see?</h3>
            <p>
              Accepting this demo only changes the sample status. No electronic
              signature is collected.
            </p>
            {viewAccept ? (
              <div className="demo-success">
                <CheckCircle2 size={25} />
                <strong>Acceptance simulated</strong>
                <small>This is only a visual preview.</small>
              </div>
            ) : (
              <button
                className="btn outline full"
                onClick={() => {
                  setViewAccept(true);
                  updateStatus('Aceptada');
                }}
              >
                <Heart size={16} /> Simulate acceptance
              </button>
            )}
          </div>
        </div>
      </div>
      <footer className="client-footer">
        HAVANA NICE · SERVING LOVE THROUGH LIVE MUSIC{' '}
        <span>VISUAL DEMO ONLY</span>
      </footer>
    </div>
  );
}
