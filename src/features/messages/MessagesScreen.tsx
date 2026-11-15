import type { Dispatch, SetStateAction } from 'react';
import { Send } from 'lucide-react';
import type { Quote } from '../quotes/types';

type Props = {
  quotes: Quote[];
  item: Quote;
  active: string;
  setActive: Dispatch<SetStateAction<string>>;
  newMessage: string;
  setNewMessage: Dispatch<SetStateAction<string>>;
  sendAdmin: () => void;
};

/** Sección extraída sin modificar la interfaz ni las acciones del prototipo. */
export default function MessagesScreen({
  quotes,
  item,
  active,
  setActive,
  newMessage,
  setNewMessage,
  sendAdmin,
}: Props) {
  return (
    <div className="page">
      <div className="intro-line">
        <div>
          <span className="eyebrow">CONVERSATIONS</span>
          <h1>Mensajes de clientes</h1>
          <p>Conversaciones organizadas por cotización.</p>
        </div>
        <span className="demo-tag">DATOS DE EJEMPLO</span>
      </div>
      <div className="chat-layout panel">
        <div className="chat-list">
          <span className="eyebrow">CLIENT CONVERSATIONS</span>
          <h3>Bandeja</h3>
          {quotes.map(q => (
            <button
              className={
                q.id === active ? 'chat-list-item active' : 'chat-list-item'
              }
              onClick={() => setActive(q.id)}
              key={q.id}
            >
              <span className="chat-avatar">{(q.name || '?')[0]}</span>
              <div>
                <strong>{q.name}</strong>
                <small>
                  {q.messages?.length
                    ? q.messages[q.messages.length - 1].text
                    : 'Sin mensajes todavía'}
                </small>
              </div>
            </button>
          ))}
        </div>
        <div className="chat-content">
          <div className="chat-person">
            <div className="chat-avatar">{(item.name || '?')[0]}</div>
            <div>
              <strong>{item.name}</strong>
              <small>Conversación de prueba</small>
            </div>
          </div>
          <div className="chat-bubbles">
            {!(item.messages || []).length && (
              <div className="chat-empty">
                Todavía no hay mensajes para esta propuesta.
              </div>
            )}
            {(item.messages || []).map((msg, i) => (
              <div
                className={
                  'bubble ' + (msg.from === 'admin' ? 'outgoing' : 'incoming')
                }
                key={i}
              >
                <small>{msg.from === 'admin' ? 'Fer & Noa' : 'CLIENT'}</small>
                <p>{msg.text}</p>
                <time>{msg.time}</time>
              </div>
            ))}
          </div>
          <div className="compose">
            <input
              placeholder="Escribe una respuesta de prueba..."
              aria-label="Respuesta de prueba"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') sendAdmin();
              }}
            />
            <button type="button" className="btn primary" aria-label="Enviar respuesta de prueba" onClick={sendAdmin}>
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
