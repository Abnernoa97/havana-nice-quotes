import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as PointerReact } from 'react';
import type { CarolinaTransform } from './carolina-layout';
import { ZERO_TRANSFORM, clampTransform } from './carolina-layout';

export type CarolinaTextInteraction = {
  editingId: string | null;
  transformingId: string | null;
  onTap: (id: string) => void;
  onCommitText: (id: string, value: string) => void;
  onSelectTransform: (id: string) => void;
  onCommitTransform: (id: string, value: CarolinaTransform) => void;
};
type Props = {
  id: string;
  text: string;
  transform?: CarolinaTransform;
  interaction?: CarolinaTextInteraction;
  extra?: boolean;
};
type Point = { x: number; y: number };
type Frame = { x: number; y: number; distance: number; angle: number; transform: CarolinaTransform };
const HOLD_MS = 550;
const pointGeometry = (positions: Point[]) => {
  const p = positions[0], q = positions[1];
  return {
    x: q ? (p.x + q.x) / 2 : p.x,
    y: q ? (p.y + q.y) / 2 : p.y,
    distance: q ? Math.hypot(p.x - q.x, p.y - q.y) : 0,
    angle: q ? Math.atan2(q.y - p.y, q.x - p.x) : 0,
  };
};

/** One tap opens inline editing. Long-press unlocks move/pinch/rotate.
 * Do not write to D1 during pointermove; commit exactly once on pointer release. */
export default function CarolinaTextNode({ id, text, transform, interaction, extra = false }: Props) {
  const node = useRef<HTMLSpanElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const baseline = useRef<Frame | null>(null);
  const current = useRef<CarolinaTransform>(transform || ZERO_TRANSFORM);
  const [live, setLive] = useState<CarolinaTransform>(transform || ZERO_TRANSFORM);
  const longPressed = useRef(false);
  const swallowClick = useRef(false);
  const editing = interaction?.editingId === id;
  const moving = interaction?.transformingId === id;

  useEffect(() => {
    if (pointers.current.size) return;
    current.current = transform || ZERO_TRANSFORM;
    setLive(transform || ZERO_TRANSFORM);
  }, [transform?.x, transform?.y, transform?.scale, transform?.rotation]);
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
  useEffect(() => () => {
    if (hold.current) clearTimeout(hold.current);
  }, []);

  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  };
  const resetBaseline = () => {
    const frame = pointGeometry([...pointers.current.values()]);
    baseline.current = { ...frame, transform: { ...current.current } };
  };
  const getWidth = () => node.current?.closest('.hn-carolina-page')?.getBoundingClientRect().width || 1;
  const down = (event: PointerReact<HTMLSpanElement>) => {
    if (!interaction || editing) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (moving || longPressed.current) {
      cancelHold();
      resetBaseline();
    } else if (pointers.current.size === 1) {
      cancelHold();
      hold.current = setTimeout(() => {
        if (!pointers.current.size) return;
        longPressed.current = true;
        swallowClick.current = true;
        interaction.onSelectTransform(id);
        resetBaseline();
      }, HOLD_MS);
    }
  };
  const move = (event: PointerReact<HTMLSpanElement>) => {
    const before = pointers.current.get(event.pointerId);
    if (!before) return;
    const updated = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, updated);
    if (!moving && !longPressed.current) {
      const initial = baseline.current || { x: before.x, y: before.y };
      if (Math.hypot(updated.x - initial.x, updated.y - initial.y) > 8) cancelHold();
      return;
    }
    if (!baseline.current) resetBaseline();
    const start = baseline.current!;
    const now = pointGeometry([...pointers.current.values()]);
    const width = getWidth();
    const next = clampTransform({
      x: start.transform.x + (now.x - start.x) * 100 / width,
      y: start.transform.y + (now.y - start.y) * 100 / width,
      scale: start.transform.scale * (start.distance && now.distance
        ? now.distance / start.distance : 1),
      rotation: start.transform.rotation + (start.distance && now.distance
        ? (now.angle - start.angle) * 180 / Math.PI : 0),
    });
    current.current = next;
    setLive(next);
  };
  const up = (event: PointerReact<HTMLSpanElement>) => {
    cancelHold();
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) {
      resetBaseline();
      return;
    }
    baseline.current = null;
    if ((moving || longPressed.current) && interaction) {
      const original = transform || ZERO_TRANSFORM;
      if (JSON.stringify(current.current) !== JSON.stringify(original)) {
        interaction.onCommitTransform(id, current.current);
      }
      swallowClick.current = true;
    }
    longPressed.current = false;
  };
  const transformed = 'translate(' + live.x + 'cqw, ' + live.y +
    'cqw) rotate(' + live.rotation + 'deg) scale(' + live.scale + ')';
  return (
    <span ref={node} data-carolina-text={id}
      className={'hn-carolina-text-node' + (moving ? ' transforming' : '') +
        (editing ? ' editing' : '') + (extra ? ' extra' : '') +
        (!text && interaction ? ' empty' : '')}
      style={{ transform: transformed }}
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      role={interaction ? 'textbox' : undefined}
      aria-label={interaction ? 'Editar texto: ' + id : undefined}
      tabIndex={interaction && !editing ? 0 : undefined}
      onPointerDown={down} onPointerMove={move}
      onPointerUp={up} onPointerCancel={up}
      onContextMenu={event => { if (!editing) event.preventDefault(); }}
      onClick={() => {
        if (!interaction || editing || moving) return;
        if (swallowClick.current) { swallowClick.current = false; return; }
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
      {text || (interaction ? '✎' : '')}
    </span>
  );
}
