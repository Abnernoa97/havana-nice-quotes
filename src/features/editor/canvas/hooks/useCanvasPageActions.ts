import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Quote } from '../../../quotes/types';
import type { PhotoTarget } from '../../shared/editor-types';
import type { CarolinaPageId, PageKind } from '../../../templates/carolina-layout';
import { insertBlankPage, duplicateBlankPage, removeDesignPage } from '../../../templates/blank-pages';

type Setter<T> = Dispatch<SetStateAction<T>>;
type Params = {
 item:Quote;edit:(key:keyof Quote,value:Quote[keyof Quote])=>void;
 page:CarolinaPageId;selectedPages:CarolinaPageId[];
 showPageMenu:boolean;busy:boolean;editingId:string|null;clearSelection:()=>void;
 setShowPageMenu:Setter<boolean>;setTarget:Setter<PhotoTarget|null>;
 setBank:Setter<boolean>;setError:Setter<string>;setPage:Setter<CarolinaPageId>;
 setPhotoLayersOpen:Setter<boolean>;setTransformingId:Setter<string|null>;
 setEditingId:Setter<string|null>;setLastTextId:Setter<string|null>;
 setSelectedPhotoId:Setter<string|null>;
 setPhotoTool:Setter<'crop'|'vignette'|null>;setTrashHovered:Setter<boolean>;
};
/** Page actions update the existing designLayout without a second page model. */
export function useCanvasPageActions({
 item,edit,page,selectedPages,showPageMenu,busy,editingId,clearSelection,
 setShowPageMenu,setTarget,setBank,setError,setPage,
 setPhotoLayersOpen,setTransformingId,setEditingId,setLastTextId,
 setSelectedPhotoId,setPhotoTool,setTrashHovered,
}:Params){
  const togglePageMenu=()=>{
    if(busy)return;
    if(showPageMenu){setShowPageMenu(false);return;}
    if(editingId && document.activeElement instanceof HTMLElement)document.activeElement.blur();
    // A new page action replaces whichever text, photo or gesture tool was open.
    clearSelection();setTarget(null);setBank(false);setError('');
    setShowPageMenu(true);
  };
  useEffect(()=>{
    if(!showPageMenu)return;
    // A tap outside + Página dismisses it, without swallowing the next action.
    const onPointerDown=(event:PointerEvent)=>{
      if(!(event.target instanceof Element)||!event.target.closest('.hn-page-kind-wrap'))
        setShowPageMenu(false);
    };
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setShowPageMenu(false);
    };
    document.addEventListener('pointerdown',onPointerDown,true);
    document.addEventListener('keydown',onKeyDown);
    return ()=>{
      document.removeEventListener('pointerdown',onPointerDown,true);
      document.removeEventListener('keydown',onKeyDown);
    };
  },[showPageMenu]);
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
 return {togglePageMenu,addPage,duplicatePage,deletePage,changePage};
}
