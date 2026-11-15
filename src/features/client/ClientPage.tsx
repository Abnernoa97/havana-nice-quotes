import type { CSSProperties } from 'react';
import { CheckCircle2, Heart, MessageCircle } from 'lucide-react';
import { usd } from '../../shared/lib/formatters';
import type { Quote } from '../quotes/types';
import Proposal from './Proposal';

type Props = {
  item: Quote;
  styleName: string;
  clientMessage: string;
  setClientMessage: (value: string) => void;
  sendClient: () => void;
  updateStatus: (status: string) => void;
};

/**
 * The complete scroll proposal uses the same document as the editor preview.
 * Preview-only actions stay collapsed outside the client-facing document.
 */
export default function ClientPage({
  item,
  styleName,
  clientMessage,
  setClientMessage,
  sendClient,
  updateStatus,
}: Props) {
  return (
    <div className={'client-app client-editorial-reader hn-style-' + styleName} style={{ '--paper-accent': item.color } as CSSProperties}>
      <div className="client-reader-masthead">
        <span>HAVANA NICE</span>
        <span>LIVE MUSIC · MEXICO</span>
      </div>

      <main className="client-reader-document" aria-label={'Propuesta personalizada para ' + item.name}>
        <Proposal item={item} styleName={styleName} />
      </main>

      <section className="client-reader-afterword">
        <span className="eyebrow">A NOTE FROM US</span>
        <h2>Questions? <em>We're right here.</em></h2>
        <p>Have a question or want to adjust a detail? We'd be happy to talk it through with you.</p>
        <div className="client-reader-signoff">Fer & Noa <small>HAVANA NICE</small></div>
      </section>

      <details className="client-preview-testing">
        <summary>Herramientas de prueba del prototipo · no visibles en una cotización final</summary>
        <div className="client-preview-testing-grid">
          <div className="client-card">
            <span className="eyebrow">DEMO MESSAGE</span>
            <h3>Test a message</h3>
            <p>Solo prueba local. Este mensaje no se envía a nadie.</p>
            <textarea
              aria-label="Mensaje de prueba"
              placeholder="Hi Fer & Noa! We'd love to ask..."
              rows={3}
              value={clientMessage}
              onChange={e => setClientMessage(e.target.value)}
            />
            <button className="btn primary full" onClick={sendClient}>
              <MessageCircle size={16} /> Send a sample message
            </button>
          </div>
          <div className="client-card">
            <span className="eyebrow">DEMO STATUS</span>
            <h3>Test acceptance</h3>
            <p>Esta acción solo cambia el estado local. No hay firma ni contratación.</p>
            {item.status === 'Aceptada' ? (
              <div className="demo-success">
                <CheckCircle2 size={25} />
                <strong>Acceptance simulated</strong>
                <small>This is only a visual preview.</small>
              </div>
            ) : (
              <button className="btn outline full" onClick={() => updateStatus('Aceptada')}>
                <Heart size={16} /> Simulate acceptance
              </button>
            )}
            <p className="client-demo-investment">Total mostrado: {usd(item.price)}</p>
          </div>
        </div>
      </details>

      <footer className="client-reader-footer">
        <span>HAVANA NICE</span>
        <span>LIVE MUSIC FOR YOUR CELEBRATION</span>
      </footer>
    </div>
  );
}
