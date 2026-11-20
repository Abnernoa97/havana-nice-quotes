import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Quote } from '../quotes/types';
import { PageFlip } from '@gullabs/flipbook-core';
import { useMagazinePaperGesture } from './useMagazinePaperGesture';
import type { InteractiveMagazineFlip } from './useMagazinePaperGesture';
import { ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, CarolinaBlankPage } from '../templates/CarolinaTemplate';
import { EditorialCover, EditorialCollage, EditorialTerms } from '../templates/EditorialTemplate';
import { templateFamily } from '../templates/template-registry';
import { carolinaPageOrder, pageKind } from '../templates/carolina-layout';
import {pagePaperStyle} from '../templates/page-paper';
import QuoteChatPanel from '../quotes/QuoteChatPanel';
import './flip-magazine.css';

function MagazineLeaf({ children, className = '', paperStyle }: { children: ReactNode; className?: string; paperStyle?:CSSProperties }) {
  return <div className={'hn-leaf ' + className} data-density="soft" style={paperStyle}>{children}</div>;
}

/**
 * Independent visual experiment: a full paper-curl page-turn reader.
 * The original scrolling proposal and editor remain unchanged.
 * The source leaves are kept outside the flip container so a React
 * StrictMode remount always gets fresh page nodes.
 */
export default function FlipMagazine({ item, clientView=false }: { item: Quote; clientView?:boolean }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const turningRef = useRef(false);
  const [turning, setTurning] = useState(false);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  const [failure, setFailure] = useState(false);
  const selectedPages = carolinaPageOrder(item.designLayout);
  const total = selectedPages.length;
  const chatPage=pageKind(item.designLayout,selectedPages[page])==='chat';
  const finalChat=page===total-1&&chatPage;
  const [videoBlocked,setVideoBlocked]=useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const source = sourceRef.current;
    if (!mount || !source) return;
    let flip: PageFlip | undefined;
    let host: HTMLDivElement | undefined;
    let onVisibility: (()=>void) | undefined;
    let activePageIndex=0;
    const syncCoverVideos=(index:number)=>{
      let visibleVideo=false;
      host?.querySelectorAll<HTMLElement>('.hn-leaf').forEach((leaf,leafIndex)=>{
        leaf.querySelectorAll('video').forEach(media=>{
          media.muted=true;media.loop=true;media.controls=false;
          media.playsInline=true;
          if(!document.hidden&&leafIndex===index){
            visibleVideo=true;media.preload='auto';media.autoplay=true;
            // Only the visible PageFlip clone gets a video source. Original
            // hidden React leaves and nonvisible pages never download streams.
            const mediaUrl=media.dataset.hnVideoSrc;
            if(!media.getAttribute('src')&&mediaUrl){
              media.src=mediaUrl;
              media.load();
            }
            void media.play().then(()=>setVideoBlocked(false)).catch(()=>setVideoBlocked(true));
          }else{media.pause();media.preload='none';}
        });
      });
      if(!visibleVideo)setVideoBlocked(false);
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
        sizing: 'responsive',
        minWidth: 270,
        maxWidth: 560,
        minHeight: 382,
        maxHeight: 792,
        drawShadow: true,
        maxShadowOpacity: 0.72,
        // Match V2's responsive physical book: keep the surface height in CSS.
        flippingTime: 650,
        usePortrait: true,
        autoSize: false,
        hardCovers: false,
        pageBackground: '#f8f6f0',
        // Keep vertical touch scrolling available while horizontal swipes still turn pages.
        allowTouchScroll: true,
        // Pointer controls are owned by the live React drag on phones.
        pointerInput: ['mouse'],
        swipeDistance: 25,
        // On touch devices a controlled finger drag owns the live fold.
        foldCornerOnHover: window.matchMedia('(hover:hover) and (pointer:fine)').matches,
        flipOnClick: 'never',
      });
      flip.loadFromHTML(host.querySelectorAll<HTMLElement>('.hn-leaf'));
      flip.on('flip', e => {
        const next=e.data.page;
        activePageIndex=next;
        // Stop old leaves; resume the muted infinite loop when cover returns.
        syncCoverVideos(next);
        setPage(next);
      });
      flip.on('changeOrientation', e => setOrientation(e.data.orientation));
      flip.on('changeState',e=>{
        const busy=e.data.state==='flipping';
        turningRef.current=busy;
        setTurning(busy);
      });
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
      turningRef.current=false;
      try { flip?.destroy(); } catch (error) { console.warn('Page flip cleanup', error); }
      mount.replaceChildren();
    };
  }, [item.id, item.cover, item.coverVideo, item.name, item.note, item.package, item.price, item.location, item.deposit, item.desc, item.date, item.currency, item.style,
    JSON.stringify(item.gallery), JSON.stringify(item.carolinaCopy), JSON.stringify(item.designLayout)]);

  const changePage = (direction: 'next' | 'prev') => {
    const flip=flipRef.current as InteractiveMagazineFlip | null;
    if(!flip||turningRef.current)return;
    if(direction==='next'&&flip.canTurn('next'))flip.flipNext('bottom');
    else if(direction==='prev'&&flip.canTurn('prev')){
      // Fixed at the engine layer: previous leaf peels from the binding.
      flip.flipPrev('bottom');
    }
  };
  const paperGesture=useMagazinePaperGesture({flipRef,turningRef,
    orientation,changePage});

  return (
    <section className={'hn-magazine hn-font-' + item.font + ' hn-style-' + (item.style || 'carolina')} style={{ '--paper-accent': item.color } as CSSProperties} aria-label="Propuesta de música en vivo en formato revista">
      <header className="hn-magazine-intro">
        <span className="hn-magazine-kicker">HAVANA NICE / THE PRIVATE EDITION</span>
        <h1>A proposal for <em>{item.name}.</em></h1>
        <p>Turn a page or use the arrows to explore your proposal.</p>
      </header>

      <div className="hn-magazine-stage">
        <div className="hn-magazine-surface" ref={mountRef}
          aria-label={'Revista interactiva de ' + total + ' páginas'}
          onTouchStartCapture={event=>event.stopPropagation()}
          onTouchMoveCapture={event=>event.stopPropagation()}
          onTouchEndCapture={event=>event.stopPropagation()}
          onPointerDown={paperGesture.onPointerDown}
          onPointerMove={paperGesture.onPointerMove}
          onPointerUp={paperGesture.onPointerUp}
          onPointerCancel={paperGesture.onPointerCancel}/>
        {finalChat&&<div className="hn-magazine-chat-lock" onPointerDown={e=>e.stopPropagation()}>
          <button type="button" className="hn-magazine-chat-back"
            onClick={()=>changePage('prev')}><ArrowLeft size={15}/> Previous page</button>
          <QuoteChatPanel key={selectedPages[page]} quoteId={item.id}
            pageId={selectedPages[page]} compact isTemplate={item.isTemplate}/>
        </div>}
        {videoBlocked&&<button className="hn-magazine-video-play" type="button"
          style={finalChat?{top:'25%'}:undefined} onClick={()=>{
            const media=mountRef.current?.querySelectorAll<HTMLVideoElement>('.hn-leaf')[page]?.querySelector('video');
            if(media){
              media.muted=true;media.playsInline=true;
              if(!media.getAttribute('src')&&media.dataset.hnVideoSrc){
                media.src=media.dataset.hnVideoSrc;media.load();
              }
              void media.play().then(()=>setVideoBlocked(false)).catch(()=>setVideoBlocked(true));
            }
          }}>Play video</button>}
      </div>

      {failure && (
        <p className="hn-magazine-error" role="alert">
          La animación no pudo iniciarse en este navegador. Prueba a actualizar la página o utiliza el modo Scroll.
        </p>
      )}

      <div className="hn-magazine-controls">
        <button type="button" className="hn-magazine-arrow" onClick={() => changePage('prev')} disabled={page===0 || failure || turning} aria-label="Página anterior">
          <ArrowLeft size={19} />
        </button>
        <div className="hn-magazine-progress">
          <span className="hn-magazine-page-number">{String(page + 1).padStart(2, '0')} <i>/</i> {String(total).padStart(2, '0')}</span>
          <div className="hn-magazine-track"><div style={{ width: ((page + 1) / total * 100) + '%' }} /></div>
          <small><Hand size={12} /> {orientation === 'portrait' ? 'Sujeta una esquina y mueve la hoja · suelta para pasar o regresar' : 'Revista abierta · dos páginas'}</small>
        </div>
        <button type="button" className="hn-magazine-arrow" onClick={() => changePage('next')} disabled={page>=total-1 || failure || turning} aria-label="Página siguiente">
          <ArrowRight size={19} />
        </button>
      </div>
      {chatPage&&!finalChat&&
        <QuoteChatPanel key={selectedPages[page]} quoteId={item.id}
          pageId={selectedPages[page]} compact isTemplate={item.isTemplate}/>}
      {!clientView&&<p className="hn-magazine-disclaimer">Design preview only · Delivery and acceptance are not active.</p>}

      <div className="hn-magazine-source" ref={sourceRef} aria-hidden="true">
        {selectedPages.map(selectedPage=><MagazineLeaf key={selectedPage}
          paperStyle={pagePaperStyle(item.designLayout,selectedPage)}
          className={(templateFamily(item.style)==='carolina'?'hn-carolina-leaf':'hn-editorial-leaf')+
            (selectedPage===selectedPages[0]?' hn-leaf-cover':'')}>
          {item.style==='carolina'&&item.designLayout?.freeCanvas
            ? <CarolinaBlankPage item={item} page={selectedPage} staticChat/>
            : templateFamily(item.style)==='carolina'
            ? selectedPage===0?<CarolinaCover item={item}/>:
              selectedPage===1?<CarolinaCollage item={item}/>:
              selectedPage===2?<CarolinaTerms item={item}/>:
              <CarolinaBlankPage item={item} page={selectedPage} staticChat/>
            : selectedPage===0?<EditorialCover item={item}/>:
              selectedPage===1?<EditorialCollage item={item}/>:
              selectedPage===2?<EditorialTerms item={item}/>:
              <CarolinaBlankPage item={item} page={selectedPage} staticChat/>}
        </MagazineLeaf>)}
      </div>
    </section>
  );
}
