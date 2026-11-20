import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { EditQuoteField } from '../../shared/editor-types';
import type { TextToolTab } from '../../texts/TextStyleDock';
import { isCarolinaCopyField } from '../../../templates/carolina-edit-fields';
import type { CarolinaTextField } from '../../../templates/carolina-edit-fields';
import { parseWeddingDate } from '../../../../shared/lib/wedding-date';
import type { CarolinaTextInteraction } from '../../../templates/CarolinaTextNode';
import type { CarolinaFixedKey, CarolinaLayout, CarolinaTransform, CarolinaPageId } from '../../../templates/carolina-layout';
import { normalizePriceInput, safeQuotePrice } from '../../../quotes/model';
import type { Quote } from '../../../quotes/types';
type Setter<T> = Dispatch<SetStateAction<T>>;
type DraftText = {id:string;page:CarolinaPageId};
type ConfirmedText = DraftText & {text:string;centered:true};
type Context = {
  item:Quote; edit:EditQuoteField;
  updateLayout:(patch:Partial<CarolinaLayout>)=>void;
  editingId:string|null;transformingId:string|null;draftText:DraftText|null;
  newlyConfirmedText:RefObject<ConfirmedText|null>;
  lastGestureMoveAt:RefObject<number>;justMoved:RefObject<boolean>;
  setShowPageMenu:Setter<boolean>;setActiveTextTool:Setter<TextToolTab|null>;
  setSelectedPhotoId:Setter<string|null>;setTransformingId:Setter<string|null>;
  setEditingId:Setter<string|null>;setLastTextId:Setter<string|null>;
  setError:Setter<string>;setDraftText:Setter<DraftText|null>;
  setPhotoTool:Setter<'crop'|'vignette'|null>;setPhotoLayersOpen:Setter<boolean>;
  setTrashHovered:Setter<boolean>;
  clearSelection:()=>void;removeText:(id:string)=>void;
  isPhotoId:(id:string)=>boolean;overTrash:(x:number,y:number)=>boolean;
  removeElement:(id:string)=>void;
};
/** Uses the existing quote state and keeps gesture behavior in one module. */
export function createCanvasTextInteraction({
  item,edit,updateLayout,editingId,transformingId,draftText,
  newlyConfirmedText,lastGestureMoveAt,justMoved,
  setShowPageMenu,setActiveTextTool,setSelectedPhotoId,setTransformingId,
  setEditingId,setLastTextId,setError,setDraftText,setPhotoTool,
  setPhotoLayersOpen,setTrashHovered,clearSelection,removeText,
  isPhotoId,overTrash,removeElement,
}:Context):CarolinaTextInteraction{
  return {
    editingId, transformingId,
    onTap: id => { setShowPageMenu(false);setActiveTextTool(null);setSelectedPhotoId(null); setTransformingId(null); setEditingId(id); setLastTextId(id); setError(''); },
    onSelectTransform: id => {
      setShowPageMenu(false);
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
      if(!isPhotoId(id)){
        // Tap a transformed word to place the native editing caret, not to discard it.
        setTransformingId(null);setEditingId(id);setLastTextId(id);
        setActiveTextTool(null);setTrashHovered(false);
        return;
      }
      setPhotoLayersOpen(false);
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
}
