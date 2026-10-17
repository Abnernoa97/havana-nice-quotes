// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import { ArrowLeft, ArrowRight, BookOpen, Hand, RotateCcw } from 'lucide-react';
import './flip-magazine.css';

const currency = value =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function MagazineLeaf({ children, className = '' }) {
  return <div className={'hn-leaf ' + className} data-density="soft">{children}</div>;
}

/**
 * Independent visual experiment: a full paper-curl page-turn reader.
 * The original scrolling proposal and editor remain unchanged.
 * The source leaves are kept outside the flip container so a React
 * StrictMode remount always gets fresh page nodes.
 */
export default function FlipMagazine({ item }) {
  const mountRef = useRef(null);
  const sourceRef = useRef(null);
  const flipRef = useRef(null);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  const [failure, setFailure] = useState(false);
  const total = 6;

  useEffect(() => {
    const mount = mountRef.current;
    const source = sourceRef.current;
    if (!mount || !source) return;
    let flip;
    let host;
    try {
      host = document.createElement('div');
      host.className = 'hn-flip-host';
      const pages = Array.from(source.children).map(node => node.cloneNode(true));
      host.replaceChildren(...pages);
      mount.replaceChildren(host);
      flip = new PageFlip(host, {
        width: 410,
        height: 580,
        size: 'stretch',
        minWidth: 270,
        maxWidth: 560,
        minHeight: 382,
        maxHeight: 792,
        drawShadow: true,
        maxShadowOpacity: 0.72,
        flippingTime: 1080,
        usePortrait: true,
        autoSize: true,
        showCover: false,
        mobileScrollSupport: false,
        swipeDistance: 25,
        showPageCorners: true,
        disableFlipByClick: false,
      });
      flip.loadFromHtml(host.querySelectorAll('.hn-leaf'));
      flip.on('flip', e => setPage(Number(e.data || 0)));
      flip.on('changeOrientation', e => setOrientation(String(e.data)));
      flipRef.current = flip;
      setPage(0);
      setFailure(false);
    } catch (error) {
      console.error('Magazine preview failed', error);
      setFailure(true);
    }
    return () => {
      flipRef.current = null;
      try { flip?.destroy(); } catch (error) { console.warn('Page flip cleanup', error); }
      mount.replaceChildren();
    };
  }, [item.id, item.cover, item.name, item.note, item.package, item.price, item.location, item.deposit, item.desc, item.date]);

  const changePage = direction => {
    const flip = flipRef.current;
    if (!flip) return;
    if (direction === 'next' && page < total - 1) flip.flipNext('bottom');
    if (direction === 'prev' && page > 0) flip.flipPrev('bottom');
  };

  const dateLabel = item.date
    ? new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'DATE TO BE CONFIRMED';

  return (
    <section className="hn-magazine" aria-label="Vista revista con páginas que se doblan">
      <header className="hn-magazine-intro">
        <span className="hn-magazine-kicker">HAVANA NICE / THE PRIVATE EDITION</span>
        <h1>La experiencia <em>revista real.</em></h1>
        <p>Prueba el efecto sobre la portada: arrastra la esquina inferior derecha o desliza la página hacia la izquierda.</p>
      </header>

      <div className="hn-magazine-stage">
        <div className="hn-magazine-surface" ref={mountRef} aria-label="Revista interactiva de seis páginas" />
      </div>

      {failure && (
        <p className="hn-magazine-error" role="alert">
          La animación no pudo iniciarse en este navegador. Prueba a actualizar la página o utiliza el modo Scroll.
        </p>
      )}

      <div className="hn-magazine-controls">
        <button type="button" className="hn-magazine-arrow" onClick={() => changePage('prev')} disabled={page===0 || failure} aria-label="Página anterior">
          <ArrowLeft size={19} />
        </button>
        <div className="hn-magazine-progress">
          <span className="hn-magazine-page-number">{String(page + 1).padStart(2, '0')} <i>/</i> {String(total).padStart(2, '0')}</span>
          <div className="hn-magazine-track"><div style={{ width: ((page + 1) / total * 100) + '%' }} /></div>
          <small><Hand size={12} /> {orientation === 'portrait' ? 'Toca o arrastra la esquina para pasar' : 'Revista abierta · dos páginas'}</small>
        </div>
        <button type="button" className="hn-magazine-arrow" onClick={() => changePage('next')} disabled={page>=total-1 || failure} aria-label="Página siguiente">
          <ArrowRight size={19} />
        </button>
      </div>
      <p className="hn-magazine-disclaimer">Demostración del movimiento de papel. Sin envío, contrato ni firma real.</p>

      <div className="hn-magazine-source" ref={sourceRef} aria-hidden="true">
        <MagazineLeaf className="hn-cover-leaf">
          <div className="hn-cover-image" style={{ backgroundImage: 'linear-gradient(180deg, rgba(7,19,16,.24), rgba(7,19,16,.03) 36%, rgba(7,19,16,.73)), url(' + item.cover + ')' }}>
            <div className="hn-cover-top"><span>HAVANA NICE</span><small>THE PRIVATE EDITION</small></div>
            <div className="hn-cover-bottom">
              <small>A PRIVATE LIVE MUSIC PROPOSAL</small>
              <h2>{item.name}</h2>
              <div className="hn-cover-rule"></div>
              <p>{item.location}<br/>{dateLabel}</p>
            </div>
            <span className="hn-cover-number">ISSUE 001 · MEXICO</span>
          </div>
        </MagazineLeaf>
        <MagazineLeaf className="hn-editorial-leaf">
          <div className="hn-leaf-heading"><span>01 / A PERSONAL NOTE</span><span>HAVANA NICE</span></div>
          <div className="hn-editorial-content">
            <span className="hn-micro">FOR {item.name.toUpperCase()}</span>
            <h2>Live music.<br/><em>Made personal.</em></h2>
            <p>We created this proposal with your celebration in mind. Here is how HAVANA NICE can bring real live music to your favorite moments.</p>
            <div className="hn-editorial-picture" style={{backgroundImage:"url(https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&q=80)"}}></div>
            <div className="hn-signature">Fer & Noa<span>HAVANA NICE</span></div>
          </div>
          <div className="hn-leaf-foot"><span>PRIVATE PROPOSAL</span><span>02</span></div>
        </MagazineLeaf>
        <MagazineLeaf className="hn-vision-leaf">
          <div className="hn-leaf-heading"><span>02 / THE EXPERIENCE</span><span>HAVANA NICE</span></div>
          <div className="hn-vision-content">
            <h2>One celebration.<br/><em>Every moment.</em></h2>
            <div className="hn-vision-picture" style={{backgroundImage:"url(https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1000&q=80)"}}></div>
            <div className="hn-vision-rows">
              <div><strong>01</strong><span><b>COCKTAIL</b><small>A warm welcome with a fully live band.</small></span></div>
              <div><strong>02</strong><span><b>DINNER</b><small>Music that complements conversation and atmosphere.</small></span></div>
              <div><strong>03</strong><span><b>CELEBRATION</b><small>Real musicians and a room ready to dance.</small></span></div>
            </div>
          </div>
          <div className="hn-leaf-foot"><span>{item.location.toUpperCase()}</span><span>03</span></div>
        </MagazineLeaf>
        <MagazineLeaf className="hn-ensemble-leaf">
          <div className="hn-ensemble-cover" style={{backgroundImage:"linear-gradient(90deg,rgba(17,27,24,.78),rgba(17,27,24,.28)),url(https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1100&q=80)"}}>
            <div className="hn-leaf-heading light"><span>03 / THE BAND</span><span>HAVANA NICE</span></div>
            <div className="hn-ensemble-body">
              <h2>The<br/>Ensemble.</h2>
              <span className="hn-ensemble-band">{item.package}</span>
              <div className="hn-ensemble-list"><span>LIVE MUSICIANS</span><span>REAL INSTRUMENTS</span><span>PERSONAL MUSIC PLANNING</span></div>
              <p>Played live, from the first note to the last.</p>
            </div>
            <div className="hn-leaf-foot light"><span>LIVE MUSIC IN MEXICO</span><span>04</span></div>
          </div>
        </MagazineLeaf>
        <MagazineLeaf className="hn-investment-leaf">
          <div className="hn-leaf-heading"><span>04 / PRIVATE PROPOSAL</span><span>HAVANA NICE</span></div>
          <div className="hn-investment-body">
            <span className="hn-micro">YOUR LIVE MUSIC EXPERIENCE</span>
            <h2>The<br/><em>Investment.</em></h2>
            <p>{item.package}</p>
            <div className="hn-investment-total">{currency(item.price)}<small>USD · PROPOSAL TOTAL</small></div>
            <div className="hn-investment-rule"/>
            <div className="hn-investment-details"><span>RESERVATION DEPOSIT · {item.deposit}%</span><strong>{currency(item.price * item.deposit / 100)}</strong></div>
            <div className="hn-investment-rule"/>
            <p className="hn-investment-copy">{item.desc}</p>
            <small className="hn-investment-notice">VISUAL SAMPLE ONLY — NOT A FORMAL QUOTE.</small>
          </div>
          <div className="hn-leaf-foot"><span>HAVANA NICE / QUOTES STUDIO</span><span>05</span></div>
        </MagazineLeaf>
        <MagazineLeaf className="hn-end-leaf">
          <div className="hn-leaf-heading"><span>05 / END NOTE</span><span>HAVANA NICE</span></div>
          <div className="hn-end-photo" style={{backgroundImage:"url(https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1000&q=80)"}}></div>
          <div className="hn-end-body"><span className="hn-micro">FER & NOA</span><h2>We'd love to<br/><em>be part of it.</em></h2><p>Thanks for considering HAVANA NICE for your celebration. We're here for questions, ideas, and the details that matter to you.</p><strong>HAVANA NICE</strong></div>
          <div className="hn-leaf-foot"><span>SERVING LOVE THROUGH LIVE MUSIC</span><span>06</span></div>
        </MagazineLeaf>
      </div>
    </section>
  );
}
