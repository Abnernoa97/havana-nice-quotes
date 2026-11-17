import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Trash2, Plus, Copy, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { carolinaPhotoOrder, carolinaPageOrder, photoSlotToAdd, CAROLINA_MAX_SLOTS, MAX_DESIGN_ELEMENTS, isBlankPage } from '../../templates/carolina-layout';
import { insertBlankPage, duplicateBlankPage, shiftPage, removeDesignPage } from '../../templates/blank-pages';
import type { CarolinaPageId } from '../../templates/carolina-layout';
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
  const [page, setPage] = useState<CarolinaPageId>(()=>carolinaPageOrder(item.designLayout)[0]);
  const selectedPages=carolinaPageOrder(item.designLayout);
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
    setPage(carolinaPageOrder(item.designLayout)[0]); setTarget(null); setBank(false); setEditingId(null); setTransformingId(null);
    setLastTextId(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTrashHovered(false);
  }, [item.id, item.style]);
  useEffect(()=>{
    if(!selectedPages.includes(page))setPage(selectedPages[0]);
  },[page,JSON.stringify(selectedPages)]);
  const updateLayout = (patch: Partial<CarolinaLayout>) => {
    edit('designLayout', { ...item.designLayout, ...patch });
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
        updateLayout({ fixed: { ...item.designLayout?.fixed, [key]: value.slice(0, 1200) } });
      } else if (id.startsWith('extra:')) {
        const extras = item.designLayout?.extras || [];
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
    onDeselectTransform: () => {
      setTransformingId(null);setTrashHovered(false);setLastTextId(null);
      setSelectedPhotoId(null);setPhotoLayersOpen(false);setEditingId(null);
    },
    onCommitTransform: (id: string, transform: CarolinaTransform) => {
      updateLayout({ transforms: { ...item.designLayout?.transforms, [id]: transform } });
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
    const id = crypto.randomUUID();
    if((item.designLayout?.extras?.length||0)>=MAX_DESIGN_ELEMENTS){
      setError('Límite de textos alcanzado en esta plantilla.');return;
    }
    updateLayout({ extras: [...(item.designLayout?.extras || []), {
      id, page, text: '',
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
    setPhotoLayersOpen(false);setTransformingId(null);setEditingId(null);
    setLastTextId(null);setSelectedPhotoId(null);setPhotoTool(null);setTrashHovered(false);
  };
  const addPage=()=>{
    const result=insertBlankPage(item.designLayout,page);
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
  const movePage=(step:-1|1)=>{
    const next=shiftPage(item.designLayout,page,step);
    if(next){edit('designLayout',next);clearSelection();setError('')}
  };
  const deletePage=()=>{
    if(selectedPages.length<=1){setError('La plantilla debe tener al menos una página.');return}
    if(!window.confirm('¿Eliminar esta página y sus elementos de la plantilla? Las fotos de la nube se conservarán.'))return;
    const next=removeDesignPage(item.designLayout,page);
    if(!next)return;
    edit('designLayout',next.layout);setPage(next.page);clearSelection();setError('');
  };
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
  const pageBackgroundId=isBlankPage(page)
    ? item.designLayout?.extraPhotos?.find(photo=>photo.page===page&&!!photo.url)?.id
    : undefined;
  const setPhotoOrder = (order:number[]) => updateLayout({photoOrder:order});
  const selectPhoto = (id:string) => {
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
    if (page===1) { addPhotoBlock(); return; }
    const existing=(item.designLayout?.extraPhotos||[]).filter(photo=>!!photo.url);
    if(existing.length>=MAX_DESIGN_ELEMENTS){
      setError('Máximo de fotografías y videos añadidos alcanzado.');return;
    }
    // Keep the new frame in local picker state until a file is really chosen.
    setTransformingId(null);setSelectedPhotoId(null);setLastTextId(null);
    setBank(false);setError('');setTarget(`extra:${crypto.randomUUID()}`);
  };
  const addPhotoBlock = () => {
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
  return (
    <section className="hn-canvas">
      {<div className="hn-canvas-toolbar">
        <button type="button" onClick={addFreeText}>+ Texto</button>
        <button type="button" onClick={addPhotoAnywhere}
          disabled={page===1&&photoOrder.length>=CAROLINA_MAX_SLOTS}>+ Foto</button>
        <button type="button" onClick={addPage} className="hn-canvas-add-page"
          aria-label="Agregar página en blanco"><Plus size={17}/> Página</button>
        {transformingId && <span>Arrastra · Amplía o gira con dos dedos</span>}
      </div>}
      <div className="hn-canvas-sheet" onPointerDown={event => {
        const target=event.target;
        if (transformingId && !event.isPrimary) return;
        if (target instanceof Element && !target.closest('[data-carolina-text], .hn-carolina-photo, .hn-carolina-cover-photo, .hn-carolina-floating-photo, [data-hn-text-trash]')) {
          setTransformingId(null);
          setSelectedPhotoId(null);
          setPhotoTool(null);
          setLastTextId(null);
          if (editingId && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }} onClickCapture={event=>{
        const clicked=event.target;
        if(!(clicked instanceof Element)||clicked.closest('[data-hn-text-trash]'))return;
        const node=clicked.closest('[data-hn-photo-id], [data-carolina-text]');
        const clickedId=node?.getAttribute('data-hn-photo-id')||node?.getAttribute('data-carolina-text');
        if(transformingId && clickedId!==transformingId){
          clearSelection();event.stopPropagation();return;
        }
        if(editingId&&clickedId!==editingId){
          if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
          setLastTextId(null);event.stopPropagation();
        }
      }}>
        {page===0 && <div className="hn-canvas-cover">
          {editorial
            ? <EditorialCover item={item} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
            : <CarolinaCover item={item} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
        </div>}
        {page===1 && (editorial
          ? <EditorialCollage item={item} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaCollage item={item} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {page===2 && (editorial
          ? <EditorialTerms item={item} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaTerms item={item} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {isBlankPage(page) && <CarolinaBlankPage item={item} page={page}
          interaction={textInteraction} onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
        {transformingId && (
          <button type="button" data-hn-text-trash
            className={'hn-canvas-trash'+(trashHovered?' hot':'')}
            aria-label={isPhotoId(transformingId)?'Eliminar foto o video seleccionado':'Eliminar texto seleccionado'}
            title="Arrastra aquí para eliminar" onClick={()=>removeElement(transformingId)}>
            <Trash2 size={25}/>
          </button>
        )}
      </div>
      {<div className="hn-canvas-pager">
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
      <div className="hn-canvas-page-actions" role="group" aria-label="Organizar páginas">
        <span className="hn-canvas-page-label">{pageTitle(page,pageIndex)}</span>
        <button type="button" onClick={()=>movePage(-1)} disabled={pageIndex<=0}
          title="Mover esta página antes" aria-label="Mover página antes"><ArrowLeft size={15}/></button>
        <button type="button" onClick={()=>movePage(1)} disabled={pageIndex>=selectedPages.length-1}
          title="Mover esta página después" aria-label="Mover página después"><ArrowRight size={15}/></button>
        <button type="button" onClick={duplicatePage} disabled={!isBlankPage(page)}
          title={isBlankPage(page)?'Duplicar página en blanco':'Solo se duplican páginas propias'}
          aria-label="Duplicar página"><Copy size={15}/></button>
        <button type="button" onClick={deletePage} disabled={selectedPages.length<=1}
          title="Eliminar página" aria-label="Eliminar página"><Trash2 size={15}/></button>
      </div>
      {lastTextId && transformingId!==lastTextId && (
        <TextStyleDock textId={lastTextId}
          fontId={item.designLayout?.fonts?.[lastTextId] || item.designLayout?.defaultFont}
          style={item.designLayout?.textStyles?.[lastTextId]}
          onFontChange={chooseFont} onStyleChange={changeTextStyle}
          onClose={()=>{
            if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
            setEditingId(null); setLastTextId(null);
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
