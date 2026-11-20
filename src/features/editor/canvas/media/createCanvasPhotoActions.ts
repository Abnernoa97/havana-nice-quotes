import type { Dispatch, SetStateAction } from 'react';
import type { Quote } from '../../../quotes/types';
import type { PhotoTarget, EditQuoteField } from '../../shared/editor-types';
import type { CarolinaLayout, CarolinaPhotoStyle } from '../../../templates/carolina-layout';
import { MAX_DESIGN_ELEMENTS, photoSlotToAdd } from '../../../templates/carolina-layout';
import { carolinaPhotos } from '../../../templates/CarolinaTemplate';
import { canvasPhotoUrl } from './canvasPhotoUrl';
import { canvasPhotoTarget } from './canvasPhotoTarget';

type Set<T> = Dispatch<SetStateAction<T>>;
type Params = {
  item:Quote;edit:EditQuoteField;
  updateLayout:(patch:Partial<CarolinaLayout>)=>void;
  page:number;cleanCarolina:boolean;photoOrder:number[];
  editingId:string|null;lastTextId:string|null;
  transformingId:string|null;selectedPhotoId:string|null;
  target:PhotoTarget|null;busy:boolean;
  clearSelection:()=>void;removePhoto:(id:string)=>void;
  onUploadPhoto:(file:File,target:PhotoTarget)=>Promise<string>;
  setShowPageMenu:Set<boolean>;setPhotoAspect:Set<number>;
  setPhotoTool:Set<'crop'|'vignette'|null>;
  setPhotoLayersOpen:Set<boolean>;setSelectedPhotoId:Set<string|null>;
  setTransformingId:Set<string|null>;setEditingId:Set<string|null>;
  setLastTextId:Set<string|null>;setError:Set<string>;
  setTrashHovered:Set<boolean>;setBank:Set<boolean>;
  setTarget:Set<PhotoTarget|null>;setBusy:Set<boolean>;
};
/** All media actions use the same Quote and existing editor state. */
export function createCanvasPhotoActions({
  item,edit,updateLayout,page,cleanCarolina,photoOrder,
  editingId,lastTextId,transformingId,selectedPhotoId,target,busy,
  clearSelection,removePhoto,onUploadPhoto,
  setShowPageMenu,setPhotoAspect,setPhotoTool,
  setPhotoLayersOpen,setSelectedPhotoId,setTransformingId,
  setEditingId,setLastTextId,setError,setTrashHovered,
  setBank,setTarget,setBusy,
}:Params){
  const setPhotoOrder = (order:number[]) => updateLayout({photoOrder:order});
  const selectPhoto = (id:string) => {
    setShowPageMenu(false);
    // Exactly one active session: a different tap first dismisses text, never opens media.
    if (lastTextId || transformingId) {clearSelection();return;}
    // Empty frames open the source picker, populated photos open the immersive editor.
    const url = canvasPhotoUrl(item,id);
    if (!url) {
      const nextTarget=canvasPhotoTarget(id);
      if(nextTarget!==null)open(nextTarget);
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
    setShowPageMenu(false);
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
    const nextTarget=canvasPhotoTarget(selectedPhotoId);
    if(nextTarget!==null)open(nextTarget);
  };
  const addPhotoAnywhere=()=>{
    setShowPageMenu(false);
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
    setShowPageMenu(false);
    if (editingId && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    clearSelection();
    const slot=photoSlotToAdd(photoOrder,carolinaPhotos(item));
    if(slot===null)return;
    setTransformingId(null);setSelectedPhotoId(null);
    setTarget(slot);setBank(false);setError('');
  };
  const open = (slot: PhotoTarget) => { setShowPageMenu(false);setSelectedPhotoId(null); setPhotoTool(null); setTarget(slot); setBank(false); setError(''); };
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
  return {selectPhoto,movePhotoLayer,updatePhotoStyle,replacePhoto,
    addPhotoAnywhere,close,choose,chooseVideo,selectPhone};
}
