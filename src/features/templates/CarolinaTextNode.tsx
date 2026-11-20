import { useEffect, useRef } from 'react';
import type { CarolinaTextStyle, CarolinaTransform } from './carolina-layout';
import { elegantFontFamily, loadElegantFont } from './elegant-fonts';
import type { ElegantFontId } from './elegant-fonts';
import { useCarolinaGesture } from './useCarolinaGesture';
import type { CarolinaGestureInteraction } from './useCarolinaGesture';

export type CarolinaTextInteraction = CarolinaGestureInteraction & {
  editingId: string | null;
  onTap: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
};
type Props = {
  id: string; text: string; transform?: CarolinaTransform;
  interaction?: CarolinaTextInteraction; extra?: boolean; fontId?: ElegantFontId;
  textStyle?: CarolinaTextStyle;
};

/** Place the collapsed native caret at the actual tap, even after a transform. */
function placeCaretAtPoint(element:HTMLElement,x:number,y:number):boolean {
  const doc=document as Document & {
    caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number}|null;
    caretRangeFromPoint?:(x:number,y:number)=>Range|null;
  };
  const rect=element.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const px=Math.min(Math.max(x,rect.left+1),rect.right-1);
  const py=Math.min(Math.max(y,rect.top+1),rect.bottom-1);
  const point=doc.caretPositionFromPoint?.(px,py);
  let range:Range|null=null;
  if(point && element.contains(point.offsetNode)){
    range=document.createRange();
    range.setStart(point.offsetNode,point.offset);
    range.collapse(true);
  }else{
    const candidate=doc.caretRangeFromPoint?.(px,py);
    if(candidate && element.contains(candidate.startContainer))range=candidate;
  }
  if(!range)return false;
  const selection=window.getSelection();
  if(!selection)return false;
  selection.removeAllRanges();selection.addRange(range);
  return true;
}

/** Text changes on blur; geometry persists only after gesture release. */
export default function CarolinaTextNode({ id, text, transform, interaction, extra = false, fontId, textStyle }: Props) {
  const node = useRef<HTMLSpanElement>(null);
  const editing = interaction?.editingId === id;
  const initialCaretPoint = useRef<{x:number;y:number}|null>(null);
  const gesture = useCarolinaGesture(id, node, transform, interaction, editing);
  useEffect(() => { if (fontId) loadElegantFont(fontId); }, [fontId]);

  useEffect(() => {
    if (!editing || !node.current) return;
    const element=node.current;
    element.textContent=text;
    element.focus();
    const point=initialCaretPoint.current;
    initialCaretPoint.current=null;
    const positioned=point?placeCaretAtPoint(element,point.x,point.y):false;
    if(!positioned){
      const range=document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      const selection=window.getSelection();
      selection?.removeAllRanges();selection?.addRange(range);
    }
  }, [editing]);

  return (
    <span ref={node} data-carolina-text={id}
      className={'hn-carolina-text-node' + (gesture.selected ? ' transforming' : '') +
        (editing ? ' editing' : '') + (extra ? ' extra' : '') +
        (!text && interaction ? ' empty' : '')}
      style={{
        transform: gesture.transform +
          ' scale(' + ((textStyle?.stretchX ?? 100)/100) + ',' +
          ((textStyle?.stretchY ?? 100)/100) + ')',
        ...(fontId ? {fontFamily:elegantFontFamily(fontId)} : {}),
        ...(textStyle?.color ? {color:textStyle.color} : {}),
        ...(textStyle?.size ? {fontSize:textStyle.size + '%'} : {}),
      }}
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      role={interaction ? 'textbox' : undefined}
      aria-label={interaction ? 'Editar texto: ' + id : undefined}
      tabIndex={interaction && !editing ? 0 : undefined}
      onPointerDown={editing ? undefined : gesture.onPointerDown}
      onPointerMove={editing ? undefined : gesture.onPointerMove}
      onPointerUp={editing ? undefined : event => {
        if(gesture.selected)initialCaretPoint.current={x:event.clientX,y:event.clientY};
        gesture.onPointerUp(event);
      }}
      onPointerCancel={editing ? undefined : gesture.onPointerCancel}
      onContextMenu={event => { if (!editing) event.preventDefault(); }}
      onClick={event => {
        if(!interaction)return;
        if(editing){
          placeCaretAtPoint(event.currentTarget,event.clientX,event.clientY);
          return;
        }
        if(gesture.suppressTap())return;
        initialCaretPoint.current={x:event.clientX,y:event.clientY};
        interaction.onTap(id);
      }}
      onKeyDown={event => {
        if (!interaction) return;
        if (!editing && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault(); interaction.onTap(id);
        } else if (editing && event.key === 'Escape') node.current?.blur();
      }}
      onBlur={() => {
        if (editing && interaction) interaction.onCommitText(id, node.current?.textContent || '');
      }}>
      {text || (interaction && !extra ? '✎' : '')}
    </span>
  );
}
