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

/** Text changes on blur; geometry persists only after gesture release. */
export default function CarolinaTextNode({ id, text, transform, interaction, extra = false, fontId, textStyle }: Props) {
  const node = useRef<HTMLSpanElement>(null);
  const editing = interaction?.editingId === id;
  const gesture = useCarolinaGesture(id, node, transform, interaction, editing);
  useEffect(() => { if (fontId) loadElegantFont(fontId); }, [fontId]);

  useEffect(() => {
    if (!editing || !node.current) return;
    node.current.textContent = text;
    node.current.focus();
    const range = document.createRange();
    range.selectNodeContents(node.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
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
      onPointerDown={gesture.onPointerDown} onPointerMove={gesture.onPointerMove}
      onPointerUp={gesture.onPointerUp} onPointerCancel={gesture.onPointerCancel}
      onContextMenu={event => event.preventDefault()}
      onSelectStart={event => { if (!editing) event.preventDefault(); }}
      onClick={() => {
        if (!interaction || editing || gesture.suppressTap()) return;
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
