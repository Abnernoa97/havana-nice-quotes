import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CarolinaTransform } from './carolina-layout';
import { ZERO_TRANSFORM, clampTransform } from './carolina-layout';

export type CarolinaTextInteraction = {
  editingId: string | null;
  transformingId: string | null;
  onTap: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
  onSelectTransform: (id: string) => void;
  onCommitTransform: (id: string, transform: CarolinaTransform) => void;
};
type Props = {
  id: string; text: string; transform?: CarolinaTransform;
  interaction?: CarolinaTextInteraction; extra?: boolean;
};
type Point = { x: number; y: number };
type Frame = Point & { distance: number; angle: number; transform: CarolinaTransform };
const HOLD_MS = 550;

function geometry(values: Point[]) {
  const a = values[0], b = values[1];
  return {
    x: b ? (a.x + b.x) / 2 : a.x, y: b ? (a.y + b.y) / 2 : a.y,
    distance: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
    angle: b ? Math.atan2(b.y - a.y, b.x - a.x) : 0,
  };
}

/** Plain-text editing on tap. Long press to move; a second finger anywhere on the
 * current sheet controls scale and rotation. Persist only after gesture completion. */
export default function CarolinaTextNode({ id, text, transform, interaction, extra = false }: Props) {
  const node = useRef<HTMLSpanElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const firstPress = useRef<Point | null>(null);
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
  useEffect(() => () => { if (hold.current) clearTimeout(hold.current); }, []);

  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  };
  const startBaseline = () => {
    const frame = geometry([...pointers.current.values()]);
    baseline.current = { ...frame, transform: { ...current.current } };
  };
  const pageWidth = () => node.current?.closest('.hn-carolina-page')?.getBoundingClientRect().width || 1;

  const begin = (pointerId: number, x: number, y: number) => {
    if (!moving && !longPressed.current) swallowClick.current = false;
    pointers.current.set(pointerId, { x, y });
    if (moving || longPressed.current) {
      cancelHold();
      startBaseline();
      return;
    }
    if (pointers.current.size === 1) {
      firstPress.current = { x, y };
      cancelHold();
      hold.current = setTimeout(() => {
        if (!pointers.current.size) return;
        longPressed.current = true;
        swallowClick.current = true;
        interaction?.onSelectTransform(id);
        startBaseline();
      }, HOLD_MS);
    }
  };
  const update = (pointerId: number, x: number, y: number) => {
    if (!pointers.current.has(pointerId)) return;
    pointers.current.set(pointerId, { x, y });
    if (!moving && !longPressed.current) {
      if (firstPress.current && Math.hypot(x - firstPress.current.x, y - firstPress.current.y) > 8) {
        cancelHold();
      }
      return;
    }
    if (!baseline.current) startBaseline();
    const b = baseline.current!;
    const now = geometry([...pointers.current.values()]);
    const turn = b.distance && now.distance
      ? ((now.angle - b.angle) * 180 / Math.PI + 540) % 360 - 180 : 0;
    const result = clampTransform({
      x: b.transform.x + (now.x - b.x) * 100 / pageWidth(),
      y: b.transform.y + (now.y - b.y) * 100 / pageWidth(),
      scale: b.transform.scale * (b.distance && now.distance ? now.distance / b.distance : 1),
      rotation: b.transform.rotation + turn,
    });
    current.current = result;
    setLive(result);
  };
  const finish = (pointerId: number) => {
    cancelHold();
    if (!pointers.current.has(pointerId)) return;
    pointers.current.delete(pointerId);
    if (pointers.current.size) {
      startBaseline();
      return;
    }
    baseline.current = null;
    firstPress.current = null;
    if ((moving || longPressed.current) && interaction) {
      if (JSON.stringify(current.current) !== JSON.stringify(transform || ZERO_TRANSFORM)) {
        interaction.onCommitTransform(id, current.current);
      }
      swallowClick.current = true;
    }
    longPressed.current = false;
  };

  // The second finger can land anywhere on this sheet, even if the text is tiny.
  useEffect(() => {
    if (!moving || !node.current) return;
    const page = node.current.closest('.hn-carolina-page');
    if (!page) return;
    const outsideText = (event: PointerEvent) =>
      !!node.current && !node.current.contains(event.target as Node);
    const down = (event: PointerEvent) => {
      if (!outsideText(event) || pointers.current.size === 0) return;
      event.preventDefault();
      event.stopPropagation();
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      page.setPointerCapture(event.pointerId);
      startBaseline();
    };
    const move = (event: PointerEvent) => {
      if (outsideText(event)) update(event.pointerId, event.clientX, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (outsideText(event)) finish(event.pointerId);
    };
    page.addEventListener('pointerdown', down);
    page.addEventListener('pointermove', move);
    page.addEventListener('pointerup', up);
    page.addEventListener('pointercancel', up);
    return () => {
      page.removeEventListener('pointerdown', down);
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerup', up);
      page.removeEventListener('pointercancel', up);
    };
  }, [moving]);

  const down = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!interaction || editing || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    begin(event.pointerId, event.clientX, event.clientY);
  };
  const move = (event: ReactPointerEvent<HTMLSpanElement>) =>
    update(event.pointerId, event.clientX, event.clientY);
  const up = (event: ReactPointerEvent<HTMLSpanElement>) => finish(event.pointerId);
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
