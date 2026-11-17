import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Quote } from '../quotes/types';
import { PageFlip } from 'page-flip';
import { ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, CarolinaBlankPage } from '../templates/CarolinaTemplate';
import { EditorialCover, EditorialCollage, EditorialTerms } from '../templates/EditorialTemplate';
import { templateFamily } from '../templates/template-registry';
import { carolinaPageOrder } from '../templates/carolina-layout';
import './flip-magazine.css';

function MagazineLeaf({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'hn-leaf ' + className} data-density="soft">{children}</div>;
}

/**
 * Independent visual experiment: a full paper-curl page-turn reader.
 * The original scrolling proposal and editor remain unchanged.
 * The source leaves are kept outside the flip container so a React
 * StrictMode remount always gets fresh page nodes.
 */
export default function FlipMagazine({ item }: { item: Quote }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  const [failure, setFailure] = useState(false);
  const selectedPages = carolinaPageOrder(item.designLayout);
  const total = selectedPages.length;

  useEffect(() => {
    const mount = mountRef.current;
    const source = sourceRef.current;
    if (!mount || !source) return;
    let flip: PageFlip | undefined;
    let host: HTMLDivElement | undefined;
    let onVisibility: (()=>void) | undefined;
    let activePageIndex=0;
    const syncCoverVideos=(index:number)=>{
      host?.querySelectorAll<HTMLElement>('.hn-leaf').forEach((leaf,leafIndex)=>{
        leaf.querySelectorAll('video').forEach(media=>{
          media.muted=true;media.loop=true;media.controls=false;
          if(!document.hidden&&leafIndex===index)void media.play().catch(()=>{});
          else media.pause();
        });
      });
    };
    try {
      host = document.createElement('div');
      host.className = 'hn-flip-host';
      const pages = Array.from(source.children).map(node => node.cloneNode(true));
      // The hidden source is layout-only; play only the visible PageFlip clone.
      source.querySelectorAll('video').forEach(media=>{
        media.autoplay=false;media.pause();
      });
      onVisibility=()=>{
        if(document.hidden)host?.querySelectorAll('video').forEach(media=>media.pause());
        else syncCoverVideos(activePageIndex);
      };
      document.addEventListener('visibilitychange',onVisibility);
      host.replaceChildren(...pages);
      mount.replaceChildren(host);
      // One selected page is a real single leaf, not a fabricated blank book page.
      if (pages.length === 1) {
        host.classList.add('hn-flip-single');
        flipRef.current = null;
        setPage(0);
        setFailure(false);
        syncCoverVideos(0);
        return () => {
          if(onVisibility)document.removeEventListener('visibilitychange',onVisibility);
          host?.querySelectorAll('video').forEach(media=>media.pause());
          mount.replaceChildren();
        };
      }
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
        // Keep vertical touch scrolling available while horizontal swipes still turn pages.
        mobileScrollSupport: true,
        swipeDistance: 25,
        showPageCorners: true,
        disableFlipByClick: false,
      });
      flip.loadFromHTML(host.querySelectorAll<HTMLElement>('.hn-leaf'));
      flip.on('flip', e => {
        const next=Number(e.data||0);
        activePageIndex=next;
        // Stop old leaves; resume the muted infinite loop when cover returns.
        syncCoverVideos(next);
        setPage(next);
      });
      flip.on('changeOrientation', e => setOrientation(String(e.data)));
      flipRef.current = flip;
      setPage(0);
      setFailure(false);
      syncCoverVideos(0);
    } catch (error) {
      console.error('Magazine preview failed', error);
      setFailure(true);
    }
    return () => {
      if(onVisibility)document.removeEventListener('visibilitychange',onVisibility);
      host?.querySelectorAll('video').forEach(media=>media.pause());
      flipRef.current = null;
      try { flip?.destroy(); } catch (error) { console.warn('Page flip cleanup', error); }
      mount.replaceChildren();
    };
  }, [item.id, item.cover, item.coverVideo, item.name, item.note, item.package, item.price, item.location, item.deposit, item.desc, item.date, item.currency, item.style,
    JSON.stringify(item.gallery), JSON.stringify(item.carolinaCopy), JSON.stringify(item.designLayout)]);

  const changePage = (direction: 'next' | 'prev') => {
    const flip = flipRef.current;
    if (!flip) return;
    if (direction === 'next' && page < total - 1) flip.flipNext('bottom');
    if (direction === 'prev' && page > 0) flip.flipPrev('bottom');
  };

  return (
    <section className={'hn-magazine hn-font-' + item.font + ' hn-style-' + (item.style || 'carolina')} style={{ '--paper-accent': item.color } as CSSProperties} aria-label="Propuesta de música en vivo en formato revista">
      <header className="hn-magazine-intro">
        <span className="hn-magazine-kicker">HAVANA NICE / THE PRIVATE EDITION</span>
        <h1>A proposal for <em>{item.name}.</em></h1>
        <p>Turn a page or use the arrows to explore your proposal.</p>
      </header>

      <div className="hn-magazine-stage">
        <div className="hn-magazine-surface" ref={mountRef} aria-label={'Revista interactiva de ' + total + ' páginas'} />
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
      <p className="hn-magazine-disclaimer">Design preview only · Delivery and acceptance are not active.</p>

      <div className="hn-magazine-source" ref={sourceRef} aria-hidden="true">
        {selectedPages.map(selectedPage=><MagazineLeaf key={selectedPage}
          className={templateFamily(item.style)==='carolina'?'hn-carolina-leaf':'hn-editorial-leaf'}>
          {templateFamily(item.style)==='carolina'
            ? selectedPage===0?<CarolinaCover item={item}/>:
              selectedPage===1?<CarolinaCollage item={item}/>:
              selectedPage===2?<CarolinaTerms item={item}/>:
              <CarolinaBlankPage item={item} page={selectedPage}/>
            : selectedPage===0?<EditorialCover item={item}/>:
              selectedPage===1?<EditorialCollage item={item}/>:
              selectedPage===2?<EditorialTerms item={item}/>:
              <CarolinaBlankPage item={item} page={selectedPage}/>}
        </MagazineLeaf>)}
      </div>
    </section>
  );
}
