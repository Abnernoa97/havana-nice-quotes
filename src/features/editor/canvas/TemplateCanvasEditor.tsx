import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { isCarolinaCopyField } from '../../templates/carolina-edit-fields';
import type { CarolinaTextField } from '../../templates/carolina-edit-fields';
import TextStyleDock from '../texts/TextStyleDock';
import type { TextToolTab } from '../texts/TextStyleDock';
import PhotoLayersPanel from '../photos/PhotoLayersPanel';
import PhotoSourcePicker from '../photos/PhotoSourcePicker';
import { listPhotoLayers } from '../photos/photo-layers';
import type { PhotoTarget } from '../shared/editor-types';
import PhotoEditingWorkspace from '../photos/PhotoEditingWorkspace';
import type { ElegantFontId } from '../../templates/elegant-fonts';
import type { CarolinaFixedKey, CarolinaLayout, CarolinaTextStyle } from '../../templates/carolina-layout';
import { carolinaPhotoOrder, carolinaPageOrder, CAROLINA_MAX_SLOTS, MAX_DESIGN_ELEMENTS, isBlankPage, cleanEmptyExtraTexts, CAROLINA_PAGE_TITLES } from '../../templates/carolina-layout';
import { pageBackgroundMediaId } from '../../templates/page-background';
import type { CarolinaPageId } from '../../templates/carolina-layout';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import { templateFamily } from '../../templates/template-registry';
import CanvasPageToolbar from './components/CanvasPageToolbar';
import CanvasPageContent from './components/CanvasPageContent';
import CanvasPagePager from './components/CanvasPagePager';
import { useCanvasPageActions } from './hooks/useCanvasPageActions';
import { useCanvasTapConfirmation } from './hooks/useCanvasTapConfirmation';
import { createCanvasTextInteraction } from './interactions/createCanvasTextInteraction';
import { canvasPhotoUrl } from './media/canvasPhotoUrl';
import { createCanvasPhotoActions } from './media/createCanvasPhotoActions';
import { carolinaPhotos } from '../../templates/CarolinaTemplate';
import './template-canvas.css';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  photos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<string>;
};
const pageTitle=(page:number,index:number)=>isBlankPage(page)?'Página '+(index+1):CAROLINA_PAGE_TITLES[page as 0|1|2]||'Página '+(index+1);

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
    setLastTextId(null); setActiveTextTool(null); setSelectedPhotoId(null); setPhotoTool(null); setPhotoLayersOpen(false); setTrashHovered(false); setDraftText(null); setShowPageMenu(false);
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
  const addFreeText = () => {
    setShowPageMenu(false);
    setTarget(null);setBank(false);
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
  const {togglePageMenu,addPage,duplicatePage,deletePage,changePage}=useCanvasPageActions({
    item,edit,page,selectedPages,showPageMenu,busy,editingId,clearSelection,
    setShowPageMenu,setTarget,setBank,setError,setPage,
    setPhotoLayersOpen,setTransformingId,setEditingId,setLastTextId,
    setSelectedPhotoId,setPhotoTool,setTrashHovered,
  });
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
  const {selectPhoto,movePhotoLayer,updatePhotoStyle,replacePhoto,
    addPhotoAnywhere,close,choose,chooseVideo,selectPhone}=createCanvasPhotoActions({
    item,edit,updateLayout,page,cleanCarolina,photoOrder,
    editingId,lastTextId,transformingId,selectedPhotoId,target,busy,
    clearSelection,removePhoto,onUploadPhoto,
    setShowPageMenu,setPhotoAspect,setPhotoTool,
    setPhotoLayersOpen,setSelectedPhotoId,setTransformingId,
    setEditingId,setLastTextId,setError,setTrashHovered,
    setBank,setTarget,setBusy,
  });
  const textInteraction=createCanvasTextInteraction({
    item,edit,updateLayout,editingId,transformingId,draftText,
    newlyConfirmedText,lastGestureMoveAt,justMoved,
    setShowPageMenu,setActiveTextTool,setSelectedPhotoId,setTransformingId,
    setEditingId,setLastTextId,setError,setDraftText,setPhotoTool,
    setPhotoLayersOpen,setTrashHovered,clearSelection,removeText,
    isPhotoId,overTrash,removeElement,
  });
  useCanvasTapConfirmation(transformingId,activeTextTool,editingId,clearSelection);
  const pageMenuVisible=showPageMenu&&target===null&&!lastTextId&&!selectedPhotoId&&!transformingId&&!editingId;
  const renderItem:Quote=draftText?{...item,designLayout:{...item.designLayout,
    extras:[...(item.designLayout?.extras||[]),{id:draftText.id,page:draftText.page,text:'',centered:true as const}]}}:item;
  return (
    <section className={'hn-canvas'+(lastTextId && target===null?' hn-text-focus':'')+
      (activeTextTool?' hn-tool-open':'')}>
      <CanvasPageToolbar
        onAddText={addFreeText} onAddPhoto={addPhotoAnywhere}
        addPhotoDisabled={page===1&&!cleanCarolina&&photoOrder.length>=CAROLINA_MAX_SLOTS}
        onTogglePageMenu={togglePageMenu} pageMenuVisible={pageMenuVisible}
        onAddPage={addPage} transformingId={transformingId}/>
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
        <CanvasPageContent page={page} cleanCarolina={cleanCarolina}
          editorial={editorial} renderItem={renderItem}
          textInteraction={textInteraction} selectPhoto={selectPhoto}/>
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
      <CanvasPagePager pageIndex={pageIndex} totalPages={selectedPages.length}
        canDuplicate={isBlankPage(page)||cleanCarolina}
        onChangePage={changePage} onDuplicatePage={duplicatePage} onDeletePage={deletePage}/>
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
            url={canvasPhotoUrl(item,selectedPhotoId)}
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
