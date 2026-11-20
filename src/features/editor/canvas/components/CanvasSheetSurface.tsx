import { Trash2 } from 'lucide-react';
import type { Quote } from '../../../quotes/types';
import type { CarolinaPageId } from '../../../templates/carolina-layout';
import type { CarolinaTextInteraction } from '../../../templates/CarolinaTextNode';
import CanvasPageContent from './CanvasPageContent';
import type { useCanvasSelectionState } from '../hooks/useCanvasSelectionState';

type Selection = ReturnType<typeof useCanvasSelectionState>;
type Props = {
  page:CarolinaPageId;cleanCarolina:boolean;editorial:boolean;renderItem:Quote;
  textInteraction:CarolinaTextInteraction;
  selectPhoto:(id:string)=>void;removeElement:(id:string)=>void;
  isPhotoId:(id:string)=>boolean;selection:Selection;
};
/** Preserves the original sheet DOM and the deliberate-tap vs drag rules. */
export default function CanvasSheetSurface({
  page,cleanCarolina,editorial,renderItem,textInteraction,
  selectPhoto,removeElement,isPhotoId,selection,
}:Props){
  const {lastTextId,transformingId,editingId,activeTextTool,trashHovered,
    lastGestureMoveAt,clearSelection}=selection;
  return (
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
  );
}
