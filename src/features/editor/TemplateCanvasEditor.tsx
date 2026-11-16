import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Images, Smartphone, Trash2, X } from 'lucide-react';
import { isCarolinaCopyField } from '../templates/carolina-edit-fields';
import TextStyleDock from './TextStyleDock';
import type { ElegantFontId } from '../templates/elegant-fonts';
import type { CarolinaTextField } from '../templates/carolina-edit-fields';
import { parseWeddingDate } from '../../shared/lib/wedding-date';
import type { CarolinaTextInteraction } from '../templates/CarolinaTextNode';
import type { CarolinaFixedKey, CarolinaLayout, CarolinaTextStyle, CarolinaTransform } from '../templates/carolina-layout';
import { carolinaPhotoOrder, carolinaPageOrder, movePhotoSlot, photoSlotToAdd, emptyPhotoSlotToDuplicate, CAROLINA_MAX_SLOTS } from '../templates/carolina-layout';
import type { CarolinaPageId } from '../templates/carolina-layout';
import { normalizePriceInput, safeQuotePrice } from '../quotes/model';
import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import Proposal from '../client/Proposal';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, carolinaPhotos } from '../templates/CarolinaTemplate';
import './template-canvas.css';

export type PhotoTarget = 'cover' | number | `extra:${string}`;
type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  photos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<void>;
};
const pages = ['Portada', 'Collage', 'Propuesta'] as const;

/** A real preview becomes the editor: 3 Canva pages, 7 independently selectable photo regions. */
export default function TemplateCanvasEditor({ item, edit, photos, onUploadPhoto }: Props) {
  const [page, setPage] = useState<CarolinaPageId>(0);
  const [pageManager, setPageManager] = useState(false);
  const [target, setTarget] = useState<PhotoTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastTextId, setLastTextId] = useState<string | null>(null);
  const [trashHovered, setTrashHovered] = useState(false);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(carolinaPageOrder(item.carolinaLayout)[0]); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setTrashHovered(false); setPageManager(false);
  }, [item.id, item.style]);
  const updateLayout = (patch: Partial<CarolinaLayout>) => {
    edit('carolinaLayout', { ...item.carolinaLayout, ...patch });
  };
  const textInteraction: CarolinaTextInteraction = {
    editingId, transformingId,
    onTap: id => { setTransformingId(null); setEditingId(id); setLastTextId(id); setError(''); },
    onSelectTransform: id => { setEditingId(null); setTransformingId(id);
      setLastTextId(isPhotoId(id) ? null : id); setTrashHovered(false); setError(''); },
    onCommitText: (id, raw) => {
      const value = raw.trim().slice(0, 3000);
      if (id.startsWith('fixed:')) {
        const key = id.slice(6) as CarolinaFixedKey;
        updateLayout({ fixed: { ...item.carolinaLayout?.fixed, [key]: value.slice(0, 1200) } });
      } else if (id.startsWith('extra:')) {
        const extras = item.carolinaLayout?.extras || [];
        updateLayout({ extras: value
          ? extras.map(e => 'extra:' + e.id === id ? { ...e, text: value } : e)
          : extras.filter(e => 'extra:' + e.id !== id) });
      } else if (id.startsWith('field:')) {
        const field = id.slice(6).split(':')[0] as CarolinaTextField;
        if (field === 'date') {
          const date = value ? parseWeddingDate(value) : '';
          if (date !== null) edit('date', date);
          else setError('Fecha incorrecta. Escribe 15/11/2027.');
        } else if (field === 'price') {
          edit('price', safeQuotePrice(normalizePriceInput(value)));
        } else if (field === 'deposit') {
          const percent = Number(value.replace(/[^0-9]/g, ''));
          if (!value || [20, 30, 40, 50, 60, 70, 80, 90, 100].includes(percent)) {
            edit('deposit', value ? percent : 0);
          } else setError('Anticipo permitido: 20%, 30%... hasta 100%.');
        } else if (isCarolinaCopyField(field)) {
          edit('carolinaCopy', { ...item.carolinaCopy, [field]: value.slice(0, 1500) });
        } else edit(field, value);
      }
      setEditingId(null);
    },
    onCommitTransform: (id: string, transform: CarolinaTransform) => {
      updateLayout({ transforms: { ...item.carolinaLayout?.transforms, [id]: transform } });
      setTrashHovered(false);
    },
    onDrag: (_id,x,y) => {
      setTrashHovered(overTrash(x,y));
    },
    onDrop: (id,x,y) => {
      const hit=overTrash(x,y);
      setTrashHovered(false);
      if (hit) removeElement(id);
      return hit;
    },
  };
  const addFreeText = () => {
    if (!original) return;
    const id = crypto.randomUUID();
    updateLayout({ extras: [...(item.carolinaLayout?.extras || []), {
      id, page: page as 0 | 1 | 2, text: '',
    }] });
    setTransformingId(null);
    setEditingId('extra:' + id);
    setLastTextId('extra:' + id);
  };
  const isPhotoId = (id:string) => id.startsWith('photo:') || id.startsWith('photo-extra:');
  const overTrash = (x:number,y:number):boolean => {
    const element=document.querySelector('[data-hn-text-trash]');
    if (!element) return false;
    const rect=element.getBoundingClientRect();
    return x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom;
  };
  const removeText = (id:string) => {
    if (!/^(fixed:[a-zA-Z]+|field:[a-z]+(?::cover)?|extra:[a-f0-9-]{36})$/.test(id)) return;
    const transforms={...item.carolinaLayout?.transforms};
    const fonts={...item.carolinaLayout?.fonts};
    const textStyles={...item.carolinaLayout?.textStyles};
    delete transforms[id]; delete fonts[id]; delete textStyles[id];
    const clean={transforms,fonts,textStyles};
    if (id.startsWith('fixed:')) {
      const key=id.slice(6) as CarolinaFixedKey;
      updateLayout({...clean,fixed:{...item.carolinaLayout?.fixed,[key]:''}});
    } else if (id.startsWith('extra:')) {
      updateLayout({...clean,extras:(item.carolinaLayout?.extras||[])
        .filter(extra=>'extra:'+extra.id!==id)});
    } else {
      const field=id.slice(6).split(':')[0] as CarolinaTextField;
      if (field==='price' || field==='deposit') edit(field,0);
      else if (isCarolinaCopyField(field)) {
        edit('carolinaCopy',{...item.carolinaCopy,[field]:''});
      } else edit(field,'');
      updateLayout(clean);
    }
    setEditingId(null); setTransformingId(null); setLastTextId(null); setTrashHovered(false);
    setError('');
  };
  /** Only remove image references from the current quote; never delete its R2 media. */
  const removePhoto = (id:string) => {
    const transforms={...item.carolinaLayout?.transforms};
    delete transforms[id];
    if (id==='photo:cover') {
      edit('cover','');
      updateLayout({transforms});
    } else if (id.startsWith('photo-extra:')) {
      const photoId=id.slice('photo-extra:'.length);
      updateLayout({transforms,extraPhotos:(item.carolinaLayout?.extraPhotos||[])
        .filter(photo=>photo.id!==photoId)});
    } else {
      const match=/^photo:(1[01]|[0-9])$/.exec(id);
      if (!match) return;
      const slot=Number(match[1]);
      const gallery=carolinaPhotos(item);
      gallery[slot]='';
      edit('gallery',gallery);
      const current=carolinaPhotoOrder(item.carolinaLayout);
      updateLayout({transforms,photoOrder:current.length>1
        ? current.filter(index=>index!==slot) : current});
    }
    setTransformingId(null);setLastTextId(null);setTrashHovered(false);setError('');
  };
  const removeElement = (id:string) => isPhotoId(id) ? removePhoto(id) : removeText(id);
  const selectedPages=carolinaPageOrder(item.carolinaLayout);
  const pageIndex=selectedPages.indexOf(page);
  const setPageOrder=(order:CarolinaPageId[])=>updateLayout({pageOrder:order});
  const togglePage=(id:CarolinaPageId)=>{
    if (selectedPages.includes(id)) {
      if (selectedPages.length<=1) return;
      const order=selectedPages.filter(x=>x!==id);
      setPageOrder(order);
      if (page===id) setPage(order[0]);
    } else {
      setPageOrder([...selectedPages,id]);
      setPage(id);
    }
    setTransformingId(null);setLastTextId(null);setEditingId(null);
  };
  const shiftPage=(id:CarolinaPageId,delta:-1|1)=>{
    const from=selectedPages.indexOf(id),to=from+delta;
    if (from<0||to<0||to>=selectedPages.length) return;
    const order=[...selectedPages];
    [order[from],order[to]]=[order[to],order[from]];
    setPageOrder(order);
  };
  const chooseFont = (font:ElegantFontId|null) => {
    if (!lastTextId) return;
    const fonts={...item.carolinaLayout?.fonts};
    if (font) fonts[lastTextId]=font;
    else delete fonts[lastTextId];
    updateLayout({fonts});
  };
  const changeTextStyle = (key:keyof CarolinaTextStyle,value:string|number|undefined) => {
    if (!lastTextId) return;
    const textStyles={...item.carolinaLayout?.textStyles};
    const next:CarolinaTextStyle={...textStyles[lastTextId]};
    if (value===undefined) delete next[key];
    else if (key==='color' && typeof value==='string') next.color=value;
    else if (key==='size' && typeof value==='number') next.size=value;
    else if (key==='stretchX' && typeof value==='number') next.stretchX=value;
    else if (key==='stretchY' && typeof value==='number') next.stretchY=value;
    if (Object.keys(next).length) textStyles[lastTextId]=next;
    else delete textStyles[lastTextId];
    updateLayout({textStyles});
  };
  const photoOrder = carolinaPhotoOrder(item.carolinaLayout);
  const activePhoto = transformingId?.match(/^photo:(\d+)$/);
  const selectedPhoto = activePhoto ? Number(activePhoto[1]) : null;
  const setPhotoOrder = (order: number[]) => updateLayout({ photoOrder: order });
  const addPhotoAnywhere=()=>{
    if (page===1) { addPhotoBlock(); return; }
    const extras=item.carolinaLayout?.extraPhotos||[];
    if (extras.length>=24) { setError('Máximo 24 fotografías añadidas.'); return; }
    const id=crypto.randomUUID();
    updateLayout({extraPhotos:[...extras,{id,page,url:''}]});
    setTransformingId(null);setLastTextId(null);setBank(false);setTarget(`extra:${id}`);
  };
  const addPhotoBlock = () => {
    const slot = photoSlotToAdd(photoOrder, carolinaPhotos(item));
    if (slot === null) return;
    setPhotoOrder([...photoOrder, slot]);
    setTransformingId(null);
    setTarget(slot);
    setBank(false);
  };
  const reorderPhotoBlock = (slot: number, direction: -1 | 1) =>
    setPhotoOrder(movePhotoSlot(photoOrder, slot, direction));
  const hidePhotoBlock = (slot: number) => {
    if (photoOrder.length <= 1) return;
    setPhotoOrder(photoOrder.filter(index => index !== slot));
    setTransformingId(null);
  };
  const duplicatePhotoBlock = (slot: number) => {
    const gallery = carolinaPhotos(item);
    const next = emptyPhotoSlotToDuplicate(photoOrder, gallery);
    if (next === null) {
      setError('Las 12 posiciones están ocupadas. Quita un recuadro o reutiliza uno.');
      return;
    }
    gallery[next] = gallery[slot] || '';
    edit('gallery', gallery); // Same R2 photograph, no copied or uploaded file.
    setPhotoOrder([...photoOrder, next]);
    setTransformingId('photo:' + next);
    setError('');
  };
  const open = (slot: PhotoTarget) => { setTarget(slot); setBank(false); setError(''); };
  const close = () => { if (!busy) { setTarget(null); setBank(false); setError(''); } };
  const choose = (url: string) => {
    if (target === null) return;
    if (target==='cover') edit('cover',url);
    else if (typeof target==='string' && target.startsWith('extra:')) {
      const photoId=target.slice(6);
      updateLayout({extraPhotos:(item.carolinaLayout?.extraPhotos||[]).map(photo=>
        photo.id===photoId ? {...photo,url} : photo)});
    } else if (typeof target==='number') {
      const gallery=carolinaPhotos(item);
      gallery[target]=url;
      edit('gallery',gallery);
    }
    close();
  };
  const selectPhone = async (file?: File) => {
    if (!file || target === null) return;
    setBusy(true);
    try {
      await onUploadPhoto(file, target);
      setTarget(null);
      setBank(false);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la fotografía.'); }
    finally { setBusy(false); }
  };
  const original = !item.style || item.style === 'carolina';
  return (
    <section className="hn-canvas">
      {original && (
        <>
          <nav className="hn-canvas-pages" aria-label="Páginas seleccionadas para la revista">
            {selectedPages.map((id,index) => (
              <button key={id} type="button" className={page===id?'selected':''}
                aria-current={page===id?'page':undefined}
                onClick={()=>{setPage(id);setTransformingId(null);setEditingId(null);setLastTextId(null);}}>
                <small>{index+1}</small>{pages[id]}
              </button>
            ))}
            <button type="button" className="hn-canvas-page-settings"
              aria-expanded={pageManager} onClick={()=>setPageManager(value=>!value)}>
              Hojas {selectedPages.length}
            </button>
          </nav>
          {pageManager && <div className="hn-canvas-page-manager"
            role="group" aria-label="Elegir hojas del documento">
            {pages.map((title,index)=>{
              const id=index as CarolinaPageId;
              const included=selectedPages.includes(id);
              const position=selectedPages.indexOf(id);
              return <div key={id} className="hn-canvas-page-row">
                <span>{title}</span>
                {included && <>
                  <button type="button" disabled={position===0}
                    aria-label={'Mover '+title+' antes'} onClick={()=>shiftPage(id,-1)}>‹</button>
                  <button type="button" disabled={position===selectedPages.length-1}
                    aria-label={'Mover '+title+' después'} onClick={()=>shiftPage(id,1)}>›</button>
                </>}
                <button type="button" disabled={included&&selectedPages.length===1}
                  onClick={()=>togglePage(id)}>{included?'Quitar':'Añadir'}</button>
              </div>;
            })}
            <small>El orden y las hojas visibles se reflejan en Scroll y revista 3D.</small>
          </div>}
        </>
      )}
      {original && <div className="hn-canvas-toolbar">
        <button type="button" onClick={addFreeText}>+ Texto</button>
        <button type="button" onClick={addPhotoAnywhere}
          disabled={page===1&&photoOrder.length>=CAROLINA_MAX_SLOTS}>+ Foto</button>
        {transformingId && <span>Arrastra · Amplía o gira con dos dedos</span>}
      </div>}
      <div className="hn-canvas-sheet" onPointerDown={event => {
        const target=event.target;
        if (transformingId && !event.isPrimary) return;
        if (target instanceof Element && !target.closest('[data-carolina-text], .hn-carolina-photo, .hn-carolina-cover-photo, .hn-carolina-floating-photo')) {
          setTransformingId(null);
          setLastTextId(null);
          if (editingId && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }}>
        {original ? (
          <>
            {page === 0 && (
              <div className="hn-canvas-cover">
                <CarolinaCover item={item} interaction={textInteraction}
                  onSelectCover={() => open('cover')}
                  onSelectExtraPhoto={id=>open(`extra:${id}`)}/>
              </div>
            )}
            {page === 1 && <CarolinaCollage item={item} onSelectPhoto={index => open(index)}
              onSelectExtraPhoto={id=>open(`extra:${id}`)} interaction={textInteraction}/>}
            {page === 2 && <CarolinaTerms item={item} interaction={textInteraction} onSelectExtraPhoto={id=>open(`extra:${id}`)}/>}
          </>
        ) : (
          <div className="hn-canvas-editorial">
            <Proposal item={item} styleName={item.style || 'libre'} embedded/>
            <button type="button" onClick={() => open('cover')}>
              <ImagePlus size={17}/> Cambiar portada
            </button>
          </div>
        )}
      </div>
      {original && page === 1 && selectedPhoto !== null &&
        photoOrder.includes(selectedPhoto) && (
        <div className="hn-canvas-photo-actions" role="group" aria-label="Ordenar fotografías">
          <span>Foto {photoOrder.indexOf(selectedPhoto) + 1}</span>
          <button type="button" disabled={photoOrder.indexOf(selectedPhoto) === 0}
            onClick={() => reorderPhotoBlock(selectedPhoto, -1)}>Anterior</button>
          <button type="button" disabled={photoOrder.indexOf(selectedPhoto) === photoOrder.length - 1}
            onClick={() => reorderPhotoBlock(selectedPhoto, 1)}>Siguiente</button>
          <button type="button" disabled={photoOrder.length >= CAROLINA_MAX_SLOTS}
            onClick={() => duplicatePhotoBlock(selectedPhoto)}>Duplicar</button>
          <button type="button" disabled={photoOrder.length <= 1}
            onClick={() => hidePhotoBlock(selectedPhoto)}>Quitar</button>
        </div>
      )}
      {original && <div className="hn-canvas-pager">
        <button type="button" disabled={pageIndex<=0} aria-label="Página anterior"
          onClick={()=>{setPage(selectedPages[pageIndex-1]);setTransformingId(null);setEditingId(null);setLastTextId(null);}}>
          <ChevronLeft size={18}/>
        </button>
        <span>{pageIndex+1} / {selectedPages.length}</span>
        <button type="button" disabled={pageIndex>=selectedPages.length-1} aria-label="Página siguiente"
          onClick={()=>{setPage(selectedPages[pageIndex+1]);setTransformingId(null);setEditingId(null);setLastTextId(null);}}>
          <ChevronRight size={18}/>
        </button>
      </div>}
      {original && lastTextId && transformingId!==lastTextId && (
        <TextStyleDock textId={lastTextId}
          fontId={item.carolinaLayout?.fonts?.[lastTextId] || item.carolinaLayout?.defaultFont}
          style={item.carolinaLayout?.textStyles?.[lastTextId]}
          onFontChange={chooseFont} onStyleChange={changeTextStyle}
          onClose={()=>{
            if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
            setEditingId(null); setLastTextId(null);
          }}/>
      )}
      {original && transformingId && (
        <button type="button" data-hn-text-trash
          className={'hn-canvas-trash' + (trashHovered ? ' hot' : '')}
          aria-label={isPhotoId(transformingId)?'Eliminar fotografía seleccionada':'Eliminar texto seleccionado'}
          onClick={()=>removeElement(transformingId)}>
          <Trash2 size={23}/>
          <span>{trashHovered ? 'Soltar para borrar' : isPhotoId(transformingId) ? 'Eliminar foto · Arrastra aquí' : 'Eliminar texto · Arrastra aquí'}</span>
        </button>
      )}
      {error && !target && <p className="hn-canvas-error" role="alert">{error}</p>}
      {target !== null && (
        <div className="hn-canvas-shade" onClick={event => {
          if (event.target === event.currentTarget) close();
        }}>
          <div className="hn-canvas-picker" role="dialog" aria-modal="true"
            aria-label={target==='cover'?'Foto de portada':typeof target==='string'?'Foto adicional':'Foto '+(target+1)}>
            <header><strong>{target==='cover'?'Foto de portada':typeof target==='string'?'Foto adicional':'Foto '+(target+1)}</strong>
              <button type="button" disabled={busy} aria-label="Cerrar" onClick={close}><X size={19}/></button>
            </header>
            <div className="hn-canvas-sources">
              <label className="hn-canvas-source"><Smartphone size={21}/> Mi teléfono
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                  disabled={busy} onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    void selectPhone(file);
                  }}/>
              </label>
              <button type="button" className={bank ? 'hn-canvas-source selected' : 'hn-canvas-source'}
                disabled={busy} onClick={() => setBank(v => !v)}><Images size={21}/> Banco de fotos</button>
            </div>
            {bank && (
              <div className="hn-canvas-bank">
                {photos.map(photo => (
                  <button type="button" key={photo.id} disabled={busy}
                    aria-label={'Elegir ' + photo.name} onClick={() => choose(photo.url)}>
                    <img src={photo.url} alt="" loading="lazy"/>
                    {(target==='cover'?item.cover===photo.url:
                      typeof target==='string' ? item.carolinaLayout?.extraPhotos?.some(extra=>
                        extra.id===target.slice(6)&&extra.url===photo.url):
                      carolinaPhotos(item)[target]===photo.url) && <Check size={16}/>}
                  </button>
                ))}
                {!photos.length && <p>Tu banco está vacío.</p>}
                <button type="button" className="hn-canvas-remove" disabled={busy}
                  onClick={() => choose('')}>Quitar fotografía</button>
              </div>
            )}
            {busy && <p className="hn-canvas-message" role="status">Subiendo fotografía...</p>}
            {error && <p className="hn-canvas-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
