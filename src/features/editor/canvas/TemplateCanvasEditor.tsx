import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Trash2, Plus, Copy, MessageCircle, FileText, MapPin, Images } from 'lucide-react';
import { isCarolinaCopyField } from '../../templates/carolina-edit-fields';
import TextStyleDock from '../texts/TextStyleDock';
import type { TextToolTab } from '../texts/TextStyleDock';
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
import { carolinaPhotoOrder, carolinaPageOrder, photoSlotToAdd, CAROLINA_MAX_SLOTS, MAX_DESIGN_ELEMENTS, isBlankPage, cleanEmptyExtraTexts } from '../../templates/carolina-layout';
import { pageBackgroundMediaId } from '../../templates/page-background';
import { insertBlankPage, duplicateBlankPage, removeDesignPage } from '../../templates/blank-pages';
import type { CarolinaPageId,PageKind } from '../../templates/carolina-layout';
import { normalizePriceInput, safeQuotePrice } from '../../quotes/model';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import { templateFamily } from '../../templates/template-registry';
import { EditorialCover, EditorialCollage, EditorialTerms } from '../../templates/EditorialTemplate';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, CarolinaBlankPage, carolinaPhotos } from '../../templates/CarolinaTemplate';
import './template-canvas.css';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  photos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<string>;
};
const pages = ['Portada', 'Collage', 'Propuesta'] as const;
const pageTitle=(page:number,index:number)=>isBlankPage(page)?'Página '+(index+1):pages[page]||'Página '+(index+1);

/** The same real sheet is edited and displayed in Scroll and the 3D magazine. */
export default function TemplateCanvasEditor({ item, edit, photos, onUploadPhoto }: Props) {
  const editorial=templateFamily(item.style)==='editorial';
  const cleanCarolina=item.style==='carolina'&&item.designLayout?.freeCanvas===true;
  const [page, setPage] = useState<CarolinaPageId>(()=>carolinaPageOrder(item.designLayout)[0]);
  const selectedPages=carolinaPageOrder(item.designLayout);
  const [target, setTarget] = useState<PhotoTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // New text lives only in local React state until the user actually writes it.
  const [draftText, setDraftText] = useState<{id:string;page:CarolinaPageId}|null>(null);
  const newlyConfirmedText=useRef<{id:string;page:CarolinaPageId;text:string;centered:true}|null>(null);
  const lastGestureMoveAt=useRef(0);
  const justMoved=useRef(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [photoTool, setPhotoTool] = useState<'crop'|'vignette'|null>(null);
  const [photoAspect, setPhotoAspect] = useState(3/4);
  const [photoLayersOpen, setPhotoLayersOpen] = useState(false);
  const [lastTextId, setLastTextId] = useState<string | null>(null);
  const [activeTextTool,setActiveTextTool]=useState<TextToolTab|null>(null);
  const [showPageMenu,setShowPageMenu]=useState(false);
  const [trashHovered, setTrashHovered] = useState(false);
  const [transformingId, setTransformingId] = useState<string | null>(null);
  const [bank, setBank] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPage(carolinaPageOrder(item.designLayout)[0]); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setActiveTextTool(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTrashHovered(false); setDraftText(null);
  }, [item.id, item.style]);
  useEffect(()=>{
    if(!selectedPages.includes(page))setPage(selectedPages[0]);
  },[page,JSON.stringify(selectedPages)]);
  const updateLayout = (patch: Partial<CarolinaLayout>) => {
    edit('designLayout', { ...item.designLayout, ...patch });
  };
  useEffect(()=>{
    const cleaned=cleanEmptyExtraTexts(item.designLayout);
    if(cleaned && cleaned!==item.designLayout)edit('designLayout',cleaned);
  },[item.id,item.designLayout?.extras]);
  const textInteraction: CarolinaTextInteraction = {
    editingId, transformingId,
    onTap: id => { setActiveTextTool(null);setSelectedPhotoId(null); setTransformingId(null); setEditingId(id); setLastTextId(id); setError(''); },
    onSelectTransform: id => {
      // Dragging the selected text from the page immediately hides the keyboard.
      if (editingId===id && id.startsWith('extra:')) {
        const node=document.querySelector<HTMLElement>('[data-carolina-text="'+id+'"]');
        if (!node?.textContent?.trim()) {
          if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
          setDraftText(null);clearSelection();return;
        }
      }
      if (editingId && document.activeElement instanceof HTMLElement)document.activeElement.blur();
      setEditingId(null);setActiveTextTool(null);setSelectedPhotoId(null);setPhotoTool(null);setPhotoLayersOpen(false);
      setTransformingId(id);setLastTextId(isPhotoId(id)?null:id);setTrashHovered(false);setError('');
    },
    onCommitText: (id, raw) => {
      const value = raw.trim().slice(0, 3000);
      if (draftText && id==='extra:'+draftText.id) {
        // Only confirmed content enters the template, Scroll and Book 3D.
        setDraftText(null);
        if (value) {
          newlyConfirmedText.current={id:draftText.id,page:draftText.page,text:value,centered:true};
          updateLayout({extras:[...(item.designLayout?.extras||[]),newlyConfirmedText.current]});
          setTransformingId(id);setLastTextId(id);
        } else {
          newlyConfirmedText.current=null;
          clearSelection();
        }
        setEditingId(null);
        return;
      }
      if (id.startsWith('fixed:')) {
        const key = id.slice(6) as CarolinaFixedKey;
        updateLayout({ fixed: { ...item.designLayout?.fixed, [key]: value.slice(0, 1200) } });
      } else if (id.startsWith('extra:')) {
        if(!value) {removeText(id);return;}
        const extras=item.designLayout?.extras||[];
        updateLayout({extras:extras.map(e=>'extra:'+e.id===id?{...e,text:value}:e)});
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
      if(value)setTransformingId(id);
    },
    onDeselectTransform: id => {
      // A confirming tap closes ALL tools for this element, not just its move state.
      if(isPhotoId(id))setPhotoLayersOpen(false);
      clearSelection();
    },
    onCommitTransform: (id: string, transform: CarolinaTransform) => {
      // Ignore a cancelled/blank draft. A transform without text must not survive.
      const exists=(item.designLayout?.extras||[]).some(entry=>'extra:'+entry.id===id&&entry.text.trim());
      const recent=newlyConfirmedText.current;
      if(id.startsWith('extra:')&&!exists&&(!recent||'extra:'+recent.id!==id))return;
      updateLayout({transforms:{...item.designLayout?.transforms,[id]:transform},
        ...(!exists&&recent&&'extra:'+recent.id===id
          ? {extras:[...(item.designLayout?.extras||[]),recent]}:{})});
      if(recent&&'extra:'+recent.id===id)newlyConfirmedText.current=null;
      setTrashHovered(false);
    },
    onDrag: (_id,x,y) => {
      justMoved.current=true;lastGestureMoveAt.current=Date.now();
      setTrashHovered(overTrash(x,y));
    },
    onDrop: (id,x,y) => {
      const hit=overTrash(x,y);
      if(justMoved.current)lastGestureMoveAt.current=Date.now();
      justMoved.current=false;setTrashHovered(false);
      if (hit) removeElement(id);
      return hit;
    },
  };
  const addFreeText = () => {
    if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    clearSelection();
    if((item.designLayout?.extras?.length||0)>=MAX_DESIGN_ELEMENTS){
      setError('Límite de textos alcanzado en esta plantilla.');return;
    }
    const id=crypto.randomUUID();
    newlyConfirmedText.current=null;
    setDraftText({id,page}); // Do not write an empty element to D1.
    setEditingId('extra:'+id);
    setLastTextId('extra:'+id);
    setError('');
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
    const transforms={...item.designLayout?.transforms};
    const fonts={...item.designLayout?.fonts};
    const textStyles={...item.designLayout?.textStyles};
    delete transforms[id]; delete fonts[id]; delete textStyles[id];
    const clean={transforms,fonts,textStyles};
    if (id.startsWith('fixed:')) {
      const key=id.slice(6) as CarolinaFixedKey;
      updateLayout({...clean,fixed:{...item.designLayout?.fixed,[key]:''}});
    } else if (id.startsWith('extra:')) {
      updateLayout({...clean,extras:(item.designLayout?.extras||[])
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
    const transforms={...item.designLayout?.transforms};
    const photoStyles={...item.designLayout?.photoStyles};
    delete transforms[id]; delete photoStyles[id];
    if (id==='photo:cover') {
      edit('cover','');
      edit('coverVideo','');
      updateLayout({transforms,photoStyles});
    } else if (id.startsWith('photo-extra:')) {
      const photoId=id.slice('photo-extra:'.length);
      updateLayout({transforms,photoStyles,extraPhotos:(item.designLayout?.extraPhotos||[])
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
  const pageIndex=selectedPages.indexOf(page);
  const clearSelection=()=>{
    setDraftText(null);setPhotoLayersOpen(false);setTransformingId(null);setEditingId(null);
    setLastTextId(null);setActiveTextTool(null);setSelectedPhotoId(null);setPhotoTool(null);setTrashHovered(false);
  };
  const addPage=(kind?:PageKind)=>{
    const result=insertBlankPage(item.designLayout,page,kind);
    setShowPageMenu(false);
    if(!result){setError('Máximo de páginas alcanzado.');return}
    edit('designLayout',result.layout);
    setPage(result.page);clearSelection();setError('');
  };
  const duplicatePage=()=>{
    const result=duplicateBlankPage(item.designLayout,page);
    if(!result){setError('Solo puedes duplicar páginas en blanco o has alcanzado el límite de elementos.');return}
    edit('designLayout',result.layout);
    setPage(result.page);clearSelection();setError('');
  };
  const deletePage=()=>{
    if(selectedPages.length<=1){setError('La plantilla debe tener al menos una página.');return}
    if(!window.confirm('¿Eliminar esta página y sus elementos de la plantilla? Las fotos de la nube se conservarán.'))return;
    const next=removeDesignPage(item.designLayout,page);
    if(!next)return;
    edit('designLayout',next.layout);setPage(next.page);clearSelection();setError('');
  };
  const changePage = (direction: -1 | 1) => {
    setShowPageMenu(false);setPhotoLayersOpen(false);
    setPage(current => {
      const index = selectedPages.indexOf(current);
      const next = Math.max(0, Math.min(selectedPages.length - 1, index + direction));
      return selectedPages[next] ?? current;
    });
    setTransformingId(null); setEditingId(null); setLastTextId(null); setSelectedPhotoId(null); setPhotoTool(null); setTrashHovered(false);
  };
  const chooseFont = (font:ElegantFontId|null) => {
    if (!lastTextId) return;
    const fonts={...item.designLayout?.fonts};
    if (font) fonts[lastTextId]=font;
    else delete fonts[lastTextId];
    updateLayout({fonts});
  };
  const changeTextStyle = (key:keyof CarolinaTextStyle,value:string|number|undefined) => {
    if (!lastTextId) return;
    const textStyles={...item.designLayout?.textStyles};
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
  const photoOrder = carolinaPhotoOrder(item.designLayout);
  const photoLayers=listPhotoLayers(item,page);
  const pageBackgroundId=pageBackgroundMediaId(item.designLayout,page);
  const setPhotoOrder = (order:number[]) => updateLayout({photoOrder:order});
  const selectPhoto = (id:string) => {
    // Exactly one active session: a different tap first dismisses text, never opens media.
    if (lastTextId || transformingId) {clearSelection();return;}
    // Empty frames open the source picker, populated photos open the immersive editor.
    const url = id==='photo:cover' ? (item.coverVideo || item.cover) :
      id.startsWith('photo-extra:') ?
        item.designLayout?.extraPhotos?.find(p=>'photo-extra:'+p.id===id)?.url :
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
    const styles = { ...item.designLayout?.photoStyles };
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
    if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    clearSelection();
    if (page===1 && !cleanCarolina) { addPhotoBlock(); return; }
    const existing=(item.designLayout?.extraPhotos||[]).filter(photo=>!!photo.url);
    if(existing.length>=MAX_DESIGN_ELEMENTS){
      setError('Máximo de fotografías y videos añadidos alcanzado.');return;
    }
    // Keep the new frame in local picker state until a file is really chosen.
    setTransformingId(null);setSelectedPhotoId(null);setLastTextId(null);
    setBank(false);setError('');setTarget(`extra:${crypto.randomUUID()}`);
  };
  const addPhotoBlock = () => {
    if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    clearSelection();
    const slot=photoSlotToAdd(photoOrder,carolinaPhotos(item));
    if(slot===null)return;
    setTransformingId(null);setSelectedPhotoId(null);
    setTarget(slot);setBank(false);setError('');
  };
  const open = (slot: PhotoTarget) => { setSelectedPhotoId(null); setPhotoTool(null); setTarget(slot); setBank(false); setError(''); };
  const close = () => { if (!busy) { setTarget(null); setBank(false); setError(''); } };
  const applyMedia=(url:string,video:boolean)=>{
    if(target===null)return;
    if(video&&(typeof target==='number'||!url.startsWith('/api/videos/')))return;
    if(target==='cover'){
      edit('cover',video?'':url);
      edit('coverVideo',video?url:'');
    }else if(typeof target==='string'&&target.startsWith('extra:')){
      const photoId=target.slice(6);
      const previous=(item.designLayout?.extraPhotos||[]).filter(photo=>!!photo.url);
      if(url){
        const found=previous.some(photo=>photo.id===photoId);
        updateLayout({extraPhotos:found
          ? previous.map(photo=>photo.id===photoId?{...photo,url}:photo)
          : [...previous,{id:photoId,page,url}]});
      }else if(previous.some(photo=>photo.id===photoId)){
        removePhoto('photo-extra:'+photoId);
      }
    }else if(typeof target==='number'){
      const gallery=carolinaPhotos(item);
      gallery[target]=url;edit('gallery',gallery);
      if(url&&!photoOrder.includes(target))setPhotoOrder([...photoOrder,target]);
    }
    setTarget(null);setBank(false);setError('');
  };
  const choose=(url:string)=>applyMedia(url,false);
  const chooseVideo=(url:string)=>applyMedia(url,true);
  const selectPhone=async(file?:File)=>{
    if(!file||target===null)return;
    setBusy(true);
    try{
      const savedUrl=await onUploadPhoto(file,target);
      applyMedia(savedUrl,false);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'No se pudo guardar la fotografía.');
    }finally{setBusy(false);}
  };
  // A page transform is confirmed by a short tap anywhere on the app.
  // Swiping to scroll or using a second finger must never confirm by accident.
  const blockClickUntil=useRef(0);
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(Date.now()>blockClickUntil.current)return;
      blockClickUntil.current=0;
      event.preventDefault();event.stopPropagation();
    };
    document.addEventListener('click',onClick,true);
    return ()=>document.removeEventListener('click',onClick,true);
  },[]);
  useEffect(()=>{
    if(!transformingId&&!activeTextTool)return;
    let candidate:{id:number;x:number;y:number;insideSheet:boolean}|null=null;
    const down=(event:PointerEvent)=>{
      if(!(event.target instanceof Element)||event.button!==0)return;
      const el=event.target;
      if(el.closest('.hn-text-dock,.hn-photo-workspace,[data-hn-text-trash]'))return;
      if(candidate){candidate=null;return;} // multiple fingers are not a confirming tap
      candidate={id:event.pointerId,x:event.clientX,y:event.clientY,
        insideSheet:!!el.closest('.hn-canvas-sheet')};
      if(activeTextTool){event.preventDefault();event.stopPropagation();}
    };
    const move=(event:PointerEvent)=>{
      if(candidate?.id===event.pointerId&&
        Math.hypot(event.clientX-candidate.x,event.clientY-candidate.y)>9)candidate=null;
    };
    const up=(event:PointerEvent)=>{
      if(candidate?.id!==event.pointerId)return;
      const original=candidate;candidate=null;
      if(Math.hypot(event.clientX-original.x,event.clientY-original.y)>9)return;
      if(editingId&&document.activeElement instanceof HTMLElement)document.activeElement.blur();
      blockClickUntil.current=Date.now()+650;
      clearSelection();
      // Inside the page, allow the gesture hook to receive pointerup and release
      // capture. Only swallow the eventual click so no other edit opens.
      if(!original.insideSheet || activeTextTool){
        event.preventDefault();event.stopPropagation();
      }
    };
    const cancel=()=>{candidate=null;};
    document.addEventListener('pointerdown',down,true);
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerup',up,true);
    document.addEventListener('pointercancel',cancel,true);
    return ()=>{
      document.removeEventListener('pointerdown',down,true);
      document.removeEventListener('pointermove',move,true);
      document.removeEventListener('pointerup',up,true);
      document.removeEventListener('pointercancel',cancel,true);
    };
  },[transformingId,activeTextTool,editingId]);
  const renderItem:Quote=draftText?{...item,designLayout:{...item.designLayout,
    extras:[...(item.designLayout?.extras||[]),{id:draftText.id,page:draftText.page,text:'',centered:true as const}]}}:item;
  return (
    <section className={'hn-canvas'+(lastTextId && target===null?' hn-text-focus':'')+
      (activeTextTool?' hn-tool-open':'')}>
      {<div className="hn-canvas-toolbar">
        <button type="button" onClick={addFreeText}>+ Texto</button>
        <button type="button" onClick={addPhotoAnywhere}
          disabled={page===1&&!cleanCarolina&&photoOrder.length>=CAROLINA_MAX_SLOTS}>+ Foto</button>
        <div className="hn-page-kind-wrap">
          <button type="button" onClick={()=>{clearSelection();setShowPageMenu(v=>!v);}}
            className="hn-canvas-add-page" aria-expanded={showPageMenu}
            aria-controls="hn-page-kind-menu"
            aria-label="Elegir tipo de página"><Plus size={17}/> Página</button>
          {showPageMenu&&<div className="hn-page-kind-menu" id="hn-page-kind-menu"
            role="group" aria-label="Tipos de página">
            <button type="button" onClick={()=>addPage()}>
              <FileText size={18}/> Página en blanco</button>
            <button type="button" onClick={()=>addPage('chat')}>
              <MessageCircle size={18}/> Página chat</button>
            <button type="button" disabled title="Próximamente">
              <FileText size={18}/> Información <small>Próximamente</small></button>
            <button type="button" disabled title="Próximamente">
              <MapPin size={18}/> Localización <small>Próximamente</small></button>
            <button type="button" disabled title="Próximamente">
              <Images size={18}/> Álbum <small>Próximamente</small></button>
          </div>}
        </div>
        {transformingId && <span>Un dedo: mover · Dos dedos: ampliar · Giro deliberado</span>}
      </div>}
      <div className="hn-canvas-stage" onClick={event=>{
        // A tap in the whitespace surrounding the sheet accepts the current edit.
        if(event.target===event.currentTarget && (lastTextId||transformingId||editingId)){
          if(editingId && document.activeElement instanceof HTMLElement)document.activeElement.blur();
          clearSelection();
        }
      }}>
      <div className="hn-canvas-sheet" onClickCapture={event=>{
        // Pointer capture can produce a synthetic click after a drag. Never let it
        // silently close the toolbar: only a separate, intentional tap does that.
        if(Date.now()-lastGestureMoveAt.current<180){
          event.preventDefault();event.stopPropagation();return;
        }
        const clicked=event.target;
        if(!(clicked instanceof Element)||clicked.closest('[data-hn-text-trash]'))return;
        const node=clicked.closest('[data-hn-photo-id], [data-carolina-text]');
        const clickedId=node?.getAttribute('data-hn-photo-id')||node?.getAttribute('data-carolina-text');
        const activeId=lastTextId||transformingId||editingId;
        if(activeId && clickedId!==activeId){
          if(editingId && document.activeElement instanceof HTMLElement)document.activeElement.blur();
          clearSelection();
          event.preventDefault();event.stopPropagation();
        }
      }}>
        {page===0 && !cleanCarolina && <div className="hn-canvas-cover">
          {editorial
            ? <EditorialCover item={renderItem} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
            : <CarolinaCover item={renderItem} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
        </div>}
        {page===1 && !cleanCarolina && (editorial
          ? <EditorialCollage item={renderItem} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaCollage item={renderItem} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {page===2 && !cleanCarolina && (editorial
          ? <EditorialTerms item={renderItem} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaTerms item={renderItem} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {(isBlankPage(page)||cleanCarolina) && <CarolinaBlankPage item={renderItem} page={page}
          interaction={textInteraction} onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
        {transformingId && !activeTextTool && (
          <button type="button" data-hn-text-trash
            className={'hn-canvas-trash'+(trashHovered?' hot':'')}
            aria-label={isPhotoId(transformingId)?'Eliminar foto o video seleccionado':'Eliminar texto seleccionado'}
            title="Arrastra aquí para eliminar" onClick={()=>removeElement(transformingId)}>
            <Trash2 size={25}/>
          </button>
        )}
      </div>
      </div>
      <div className="hn-canvas-pager" role="group" aria-label="Navegación y acciones de páginas">
        <button type="button" disabled={pageIndex<=0} aria-label="Página anterior"
          onClick={()=>changePage(-1)}><ChevronLeft size={18}/></button>
        <span>{pageIndex+1} / {selectedPages.length}</span>
        <button type="button" disabled={pageIndex>=selectedPages.length-1} aria-label="Página siguiente"
          onClick={()=>changePage(1)}><ChevronRight size={18}/></button>
        <button type="button" onClick={duplicatePage} disabled={!isBlankPage(page)&&!cleanCarolina}
          title={isBlankPage(page)||cleanCarolina?'Duplicar página':'Solo se duplican páginas propias'}
          aria-label="Duplicar página"><Copy size={17}/></button>
        <button type="button" onClick={deletePage} disabled={selectedPages.length<=1}
          title="Eliminar página" aria-label="Eliminar página"><Trash2 size={17}/></button>
      </div>
      {lastTextId && target===null && !selectedPhotoId && (
        <TextStyleDock textId={lastTextId}
          fontId={item.designLayout?.fonts?.[lastTextId] || item.designLayout?.defaultFont}
          style={item.designLayout?.textStyles?.[lastTextId]}
          onFontChange={chooseFont} onStyleChange={changeTextStyle}
          onToolChange={tool=>{
            setActiveTextTool(tool);
            if(tool){
              if(editingId&&document.activeElement instanceof HTMLElement)
                document.activeElement.blur();
              setEditingId(null);setTransformingId(null);setTrashHovered(false);
            }
          }}
          onClose={()=>{
            if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
            clearSelection();
          }}/>
      )}
      {selectedPhotoId && !transformingId && !editingId && target===null &&
        createPortal(
          <PhotoEditingWorkspace photoId={selectedPhotoId}
            aspect={photoAspect} pageName={pageTitle(page,pageIndex)} activeTool={photoTool}
            url={selectedPhotoId==='photo:cover' ? (item.coverVideo || item.cover) :
              selectedPhotoId.startsWith('photo-extra:') ?
                item.designLayout?.extraPhotos?.find(p=>'photo-extra:'+p.id===selectedPhotoId)?.url || '' :
                carolinaPhotos(item)[Number(selectedPhotoId.slice(6))] || ''}
            style={item.designLayout?.photoStyles?.[selectedPhotoId]}
            isPageBackground={selectedPhotoId==='photo-extra:'+pageBackgroundId}
            layersPanel={<PhotoLayersPanel layers={photoLayers} open={photoLayersOpen}
              onToggle={()=>setPhotoLayersOpen(value=>!value)}
              onEdit={selectPhoto} onMove={movePhotoLayer} onDelete={removePhoto}/>}
            onStyleChange={updatePhotoStyle} onReplace={replacePhoto}
            onToolChange={setPhotoTool}
            onClose={()=>{setSelectedPhotoId(null);setPhotoTool(null);setPhotoLayersOpen(false);}}/>,
          document.body
        )}
      {error && !target && <p className="hn-canvas-error" role="alert">{error}</p>}
      {target !== null && createPortal(
        <PhotoSourcePicker target={target} item={item} photos={photos}
          bank={bank} busy={busy} error={error} onClose={close}
          onToggleBank={()=>setBank(v=>!v)} onPhoneFile={file=>{void selectPhone(file);}}
          onChoose={choose} onChooseVideo={chooseVideo}/>,document.body
      )}
    </section>
  );
}
