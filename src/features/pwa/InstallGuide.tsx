import { X } from 'lucide-react';

type Props = { onClose: () => void };

/** Guía visual de instalación, igual que en la PWA original. */
export default function InstallGuide({ onClose }: Props) {
  return (
    <div className="hn-install-overlay" role="presentation" onClick={() => onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="hn-install-title"
        className="hn-install-sheet"
        onClick={event => event.stopPropagation()}
      >
        <button type="button" aria-label="Cerrar" className="hn-install-close" onClick={() => onClose()}>
          <X size={20} />
        </button>
        <div className="hn-install-icon"><img src="/icon-192.png" alt="HAVANA NICE Quotes Studio" /></div>
        <span className="eyebrow">HAVANA NICE / QUOTES STUDIO</span>
        <h2 id="hn-install-title">Instalar en tu teléfono</h2>
        <p>Abre esta página en Chrome o Samsung Internet y añádela como aplicación. Se abrirá con su propio ícono y sin la barra del navegador.</p>
        <div className="hn-install-instructions">
          <strong>En Google Chrome (Android)</strong>
          <p>Menú <b>⋮</b> → <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b> → Confirmar.</p>
          <strong>En Samsung Internet</strong>
          <p>Abre el menú <b>☰</b> → <b>Añadir página a</b> → <b>Pantalla de inicio</b>.</p>
        </div>
        <p className="hn-install-footnote">Versión de demostración. Los datos siguen guardándose en este dispositivo; todavía no hay nube ni firma real.</p>
        <button type="button" className="btn primary full" onClick={() => onClose()}>Entendido</button>
      </section>
    </div>
  );
}
