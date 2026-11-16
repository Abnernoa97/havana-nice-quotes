import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react';
import { isCarolinaCopyField } from '../../templates/carolina-edit-fields';
import TextStyleDock from '../texts/TextStyleDock';
import PhotoLayersPanel from '../photos/PhotoLayersPanel';
import PhotoSourcePicker from '../photos/PhotoSourcePicker';
import { listPhotoLayers } from '../photos/photo-layers';
import type { PhotoTarget } from '../shared/editor-types';
import PhotoEditingWorkspace from '../photos/PhotoEditingWorkspace';
import type { ElegantFontId } from '../../templates/elegant-fonts';
import type { CarolinaTextField } from '../../templates/carolina-edit-fields';
import { parseWeddingDate } from '../../../shared/lib/wedding-date';
import type { CarolinaTextInteraction } from '../../templates/CarolinaTextNode';
import type { CarolinaFixedKey, CarolinaLayout, CarolinaTextStyle, CarolinaPhotoStyle, CarolinaTransform } from '../../templates/carolina-layout';
import { carolinaPhotoOrder, carolinaPageOrder, photoSlotToAdd, CAROLINA_MAX_SLOTS } from '../../templates/carolina-layout';
import type { CarolinaPageId } from '../../templates/carolina-layout';
import { normalizePriceInput, safeQuotePrice } from '../../quotes/model';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import Proposal from '../../client/Proposal';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, carolinaPhotos } from '../../templates/CarolinaTemplate';
import './template-canvas.css';

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
  const [target, setTarget] = useState<PhotoTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photoTool, setPhotoTool] = useState<'crop'|'vignette'|null>(null);
  const [photoAspect, setPhotoAspect] = useState(3/4);
  const [photoLayersOpen, setPhotoLayersOpen] = useState(false);
  const [lastTextId, setLastTextId] = useState<string | null>(null);
  const [trashHovered, setTrashHovered] = useState(false);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(carolinaPageOrder(item.carolinaLayout)[0]); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTrashHovered(false);
  }, [item.id, item.style]);
  const updateLayout = (patch: Partial<CarolinaLayout>) => {
    edit('carolinaLayout', { ...item.carolinaLayout, ...patch });
  };
  const textInteraction: CarolinaTextInteraction = {
    editingId, transformingId,
    onTap: id => { setSelectedPhotoId(null); setTransformingId(null); setEditingId(id); setLastTextId(id); setError(''); },
    onSelectTransform: id => { setEditingId(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTransformingId(id);
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
    const photoStyles={...item.carolinaLayout?.photoStyles};
    delete transforms[id]; delete photoStyles[id];
    if (id==='photo:cover') {
      edit('cover','');
      updateLayout({transforms,photoStyles});
    } else if (id.startsWith('photo-extra:')) {
      const photoId=id.slice('photo-extra:'.length);
      updateLayout({transforms,photoStyles,extraPhotos:(item.carolinaLayout?.extraPhotos||[])
        .filter(photo=>photo.id!==photoId)});
    } else {
      const match=/^photo:(1[01]|[0-9])$/.exec(id);
      if (!match) return;
      const slot=Number(match[1]);
      const gallery=carolinaPhotos(item);
      gallery[slot]='';
      edit('gallery',gallery);
      // Keep the collage frame in place when its image is cleared.
      updateLayout({transforms,photoStyles});
    }
    setTransformingId(null);setSelectedPhotoId(null);setLastTextId(null);setPhotoLayersOpen(false);setTrashHovered(false);setError('');
  };
  const removeElement = (id:string) => isPhotoId(id) ? removePhoto(id) : removeText(id);
  const selectedPages=carolinaPageOrder(item.carolinaLayout);
  const pageIndex=selectedPages.indexOf(page);
  const changePage = (direction: -1 | 1) => {
    setPhotoLayersOpen(false);
    setPage(current => {
      const index = selectedPages.indexOf(current);
      const next = Math.max(0, Math.min(selectedPages.length - 1, index + direction));
      return selectedPages[next] ?? current;
    });
    setTransformingId(null); setEditingId(null); setLastTextId(null); setSelectedPhotoId(null); setPhotoTool(null); setTrashHovered(false);
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
  const photoLayers=listPhotoLayers(item,page);
  const setPhotoOrder = (order:number[]) => updateLayout({photoOrder:order});
  const selectPhoto = (id:string) => {
    // Empty frames open the source picker, populated photos open the immersive editor.
    const url = id==='photo:cover' ? item.cover :
      id.startsWith('photo-extra:') ?
        item.carolinaLayout?.extraPhotos?.find(p=>'photo-extra:'+p.id===id)?.url :
        carolinaPhotos(item)[Number(id.slice(6))];
    if (!url) {
      if (id==='photo:cover') open('cover');
      else if (id.startsWith('photo-extra:')) open(`extra:${id.slice('photo-extra:'.length)}`);
      else open(Number(id.slice(6)));
      return;
    }
    const rect=document.querySelector<HTMLElement>('[data-hn-photo-id="'+id+'"]')?.getBoundingClientRect();
    setPhotoAspect(rect?.width&&rect?.height
      ? Math.max(.45,Math.min(2.5,rect.width/rect.height)) : 3/4);
    setPhotoTool(null);
    setPhotoLayersOpen(false);
    setSelectedPhotoId(id);
    setTransformingId(null);
    setEditingId(null);
    setLastTextId(null);
    setError('');
  };
  const movePhotoLayer=(id:string)=>{
    setPhotoLayersOpen(false); setEditingId(null); setSelectedPhotoId(null);
    setPhotoTool(null); setLastTextId(null); setTrashHovered(false);
    setTransformingId(id);
  };
  const updatePhotoStyle = (patch: Partial<CarolinaPhotoStyle>) => {
    if (!selectedPhotoId) return;
    const styles = { ...item.carolinaLayout?.photoStyles };
    styles[selectedPhotoId] = { ...styles[selectedPhotoId], ...patch };
    updateLayout({ photoStyles: styles });
  };
  const replacePhoto = () => {
    if (!selectedPhotoId) return;
    if (selectedPhotoId === 'photo:cover') open('cover');
    else if (selectedPhotoId.startsWith('photo-extra:'))
      open(`extra:${selectedPhotoId.slice('photo-extra:'.length)}`);
    else if (/^photo:(1[01]|[0-9])$/.test(selectedPhotoId))
      open(Number(selectedPhotoId.slice(6)));
  };
  const addPhotoAnywhere=()=>{
    if (page===1) { addPhotoBlock(); return; }
    const extras=item.carolinaLayout?.extraPhotos||[];
    if (extras.length>=24) { setError('Máximo 24 fotografías añadidas.'); return; }
    const id=crypto.randomUUID();
    updateLayout({extraPhotos:[...extras,{id,page,url:''}]});
    setTransformingId(null);setSelectedPhotoId(null);setLastTextId(null);setBank(false);setTarget(`extra:${id}`);
  };
  const addPhotoBlock = () => {
    const slot = photoSlotToAdd(photoOrder, carolinaPhotos(item));
    if (slot === null) return;
    setPhotoOrder([...photoOrder, slot]);
    setTransformingId(null);setSelectedPhotoId(null);
    setTarget(slot);
    setBank(false);
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
      {original && <div className="hn-canvas-toolbar">
        <button type="button" onClick={addFreeText}>+ Texto</button>
        <button type="button" onClick={addPhotoAnywhere}
          disabled={page===1&&photoOrder.length>=CAROLINA_MAX_SLOTS}>+ Foto</button>
        {transformingId && <span>Arrastra · Amplía o gira con dos dedos</span>}
      </div>}
      {original && <PhotoLayersPanel layers={photoLayers} open={photoLayersOpen}
        onToggle={()=>setPhotoLayersOpen(open=>!open)}
        onEdit={selectPhoto} onMove={movePhotoLayer} onDelete={removePhoto}/>}
      <div className="hn-canvas-sheet" onPointerDown={event => {
        const target=event.target;
        if (transformingId && !event.isPrimary) return;
        if (target instanceof Element && !target.closest('[data-carolina-text], .hn-carolina-photo, .hn-carolina-cover-photo, .hn-carolina-floating-photo')) {
          setTransformingId(null);
          setSelectedPhotoId(null);
          setPhotoTool(null);
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
                  onSelectCover={() => selectPhoto('photo:cover')}
                  onSelectExtraPhoto={id=>selectPhoto(`photo-extra:${id}`)}/>
              </div>
            )}
            {page === 1 && <CarolinaCollage item={item} onSelectPhoto={index => selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto(`photo-extra:${id}`)} interaction={textInteraction}/>}
            {page === 2 && <CarolinaTerms item={item} interaction={textInteraction} onSelectExtraPhoto={id=>selectPhoto(`photo-extra:${id}`)}/>}
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
      {original && <div className="hn-canvas-pager">
        <button type="button" disabled={pageIndex<=0} aria-label="Página anterior"
          onClick={()=>changePage(-1)}>
          <ChevronLeft size={18}/>
        </button>
        <span>{pageIndex+1} / {selectedPages.length}</span>
        <button type="button" disabled={pageIndex>=selectedPages.length-1} aria-label="Página siguiente"
          onClick={()=>changePage(1)}>
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
      {original && selectedPhotoId && !transformingId && !editingId && target===null &&
        createPortal(
          <PhotoEditingWorkspace photoId={selectedPhotoId}
            aspect={photoAspect} pageName={pages[page]} activeTool={photoTool}
            url={selectedPhotoId==='photo:cover' ? item.cover :
              selectedPhotoId.startsWith('photo-extra:') ?
                item.carolinaLayout?.extraPhotos?.find(p=>'photo-extra:'+p.id===selectedPhotoId)?.url || '' :
                carolinaPhotos(item)[Number(selectedPhotoId.slice(6))] || ''}
            style={item.carolinaLayout?.photoStyles?.[selectedPhotoId]}
            onStyleChange={updatePhotoStyle} onReplace={replacePhoto}
            onToolChange={setPhotoTool}
            onClose={()=>{setSelectedPhotoId(null);setPhotoTool(null);}}/>,
          document.body
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
      {target !== null && createPortal(
        <PhotoSourcePicker target={target} item={item} photos={photos}
          bank={bank} busy={busy} error={error} onClose={close}
          onToggleBank={()=>setBank(v=>!v)} onPhoneFile={file=>{void selectPhone(file);}}
          onChoose={choose}/>,document.body
      )}
    </section>
  );
}
