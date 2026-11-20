import { useEffect, useState } from 'react';
import type { PhotoTarget, EditQuoteField } from '../shared/editor-types';
import type { CarolinaLayout } from '../../templates/carolina-layout';
import { carolinaPhotoOrder, carolinaPageOrder, CAROLINA_MAX_SLOTS, MAX_DESIGN_ELEMENTS, isBlankPage, cleanEmptyExtraTexts } from '../../templates/carolina-layout';
import type { CarolinaPageId } from '../../templates/carolina-layout';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import { templateFamily } from '../../templates/template-registry';
import CanvasPageToolbar from './components/CanvasPageToolbar';
import CanvasSheetSurface from './components/CanvasSheetSurface';
import CanvasEditorPanels from './components/CanvasEditorPanels';
import CanvasPagePager from './components/CanvasPagePager';
import { useCanvasPageActions } from './hooks/useCanvasPageActions';
import { useCanvasSelectionState } from './hooks/useCanvasSelectionState';
import { useCanvasTapConfirmation } from './hooks/useCanvasTapConfirmation';
import { createCanvasTextInteraction } from './interactions/createCanvasTextInteraction';
import { createCanvasRemovalActions } from './interactions/createCanvasRemovalActions';
import { createCanvasTextStyleActions } from './interactions/createCanvasTextStyleActions';
import { createCanvasPhotoActions } from './media/createCanvasPhotoActions';
import './template-canvas.css';

type Props = {
  item: Quote;
  edit: EditQuoteField;
  photos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<string>;
};

/** The same real sheet is edited and displayed in Scroll and the 3D magazine. */
export default function TemplateCanvasEditor({ item, edit, photos, onUploadPhoto }: Props) {
  const editorial=templateFamily(item.style)==='editorial';
  const cleanCarolina=item.style==='carolina'&&item.designLayout?.freeCanvas===true;
  const [page, setPage] = useState<CarolinaPageId>(()=>carolinaPageOrder(item.designLayout)[0]);
  const selectedPages=carolinaPageOrder(item.designLayout);
  const selection=useCanvasSelectionState(item,setPage);
  const {
    target,setTarget,editingId,setEditingId,draftText,setDraftText,newlyConfirmedText,
    lastGestureMoveAt,justMoved,selectedPhotoId,setSelectedPhotoId,
    setPhotoTool,setPhotoAspect,setPhotoLayersOpen,
    lastTextId,setLastTextId,activeTextTool,setActiveTextTool,
    showPageMenu,setShowPageMenu,setTrashHovered,transformingId,setTransformingId,
    setBank,busy,setBusy,setError,clearSelection,
  }=selection;
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
  const {removeText,removePhoto,removeElement}=createCanvasRemovalActions({
    item,edit,updateLayout,isPhotoId,
    setEditingId,setTransformingId,setLastTextId,setSelectedPhotoId,
    setPhotoLayersOpen,setTrashHovered,setError,
  });
  const pageIndex=selectedPages.indexOf(page);
  const {togglePageMenu,addPage,duplicatePage,deletePage,changePage}=useCanvasPageActions({
    item,edit,page,selectedPages,showPageMenu,busy,editingId,clearSelection,
    setShowPageMenu,setTarget,setBank,setError,setPage,
  });
  const textActions=createCanvasTextStyleActions({
    item,lastTextId,updateLayout,
  });
  const photoOrder = carolinaPhotoOrder(item.designLayout);
  const mediaActions=createCanvasPhotoActions({
    item,edit,updateLayout,page,cleanCarolina,photoOrder,
    editingId,lastTextId,transformingId,selectedPhotoId,target,busy,
    clearSelection,removePhoto,onUploadPhoto,
    setShowPageMenu,setPhotoAspect,setPhotoTool,
    setPhotoLayersOpen,setSelectedPhotoId,setTransformingId,
    setEditingId,setLastTextId,setError,setTrashHovered,
    setBank,setTarget,setBusy,
  });
  const {selectPhoto,addPhotoAnywhere}=mediaActions;
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
      <CanvasSheetSurface page={page} cleanCarolina={cleanCarolina} editorial={editorial}
        renderItem={renderItem} textInteraction={textInteraction} selectPhoto={selectPhoto}
        selection={selection} removeElement={removeElement} isPhotoId={isPhotoId}/>
      <CanvasPagePager pageIndex={pageIndex} totalPages={selectedPages.length}
        canDuplicate={isBlankPage(page)||cleanCarolina}
        onChangePage={changePage} onDuplicatePage={duplicatePage} onDeletePage={deletePage}/>
      <CanvasEditorPanels item={item} photos={photos} page={page} pageIndex={pageIndex}
        selection={selection} mediaActions={mediaActions} textActions={textActions}
        removePhoto={removePhoto}/>
    </section>
  );
}
