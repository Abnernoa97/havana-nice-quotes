import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { CarolinaTransform } from './carolina-layout';
import { ZERO_TRANSFORM, clampTransform } from './carolina-layout';

export type CarolinaGestureInteraction = {
  transformingId: string | null;
  onSelectTransform: (id: string) => void;
  onCommitTransform: (id: string, value: CarolinaTransform) => void;
  onDrag?: (id: string, x: number, y: number) => void;
  /** Return true when the gesture ended on a destructive drop zone. */
  onDrop?: (id: string, x: number, y: number) => boolean;
};
type Point = { x: number; y: number };
type Frame = Point & { distance: number; angle: number; transform: CarolinaTransform };
export const LONG_PRESS_MS = 550;

function geometry(values: Point[]) {
  const a = values[0], b = values[1];
  return { x: b ? (a.x + b.x) / 2 : a.x, y: b ? (a.y + b.y) / 2 : a.y,
    distance: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0,
    angle: b ? Math.atan2(b.y - a.y, b.x - a.x) : 0 };
}

/** One shared interaction for images and text. D1 writes only when the final finger lifts.
 * Pointer capture keeps dragging smooth; second finger may touch anywhere on the sheet. */
export function useCarolinaGesture<T extends HTMLElement>(
  id: string, node: RefObject<T | null>, saved: CarolinaTransform | undefined,
  interaction: CarolinaGestureInteraction | undefined, disabled = false,
) {
  const pointers = useRef(new Map<number, Point>());
  const press = useRef<Point | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseline = useRef<Frame | null>(null);
  const current = useRef<CarolinaTransform>(saved || ZERO_TRANSFORM);
  const [live, setLive] = useState<CarolinaTransform>(saved || ZERO_TRANSFORM);
  const longPressed = useRef(false);
  const swallowClick = useRef(false);
  const selected = interaction?.transformingId === id;
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;

  useEffect(() => {
    if (pointers.current.size) return;
    current.current = saved || ZERO_TRANSFORM;
    setLive(saved || ZERO_TRANSFORM);
  }, [saved?.x, saved?.y, saved?.scale, saved?.rotation]);
  useEffect(() => () => { if (hold.current) clearTimeout(hold.current); }, []);

  const cancelHold = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; };
  const resetBaseline = () => {
    if (!pointers.current.size) return;
    baseline.current = { ...geometry([...pointers.current.values()]), transform: { ...current.current } };
  };
  const pageWidth = () => node.current?.closest('.hn-carolina-page')?.getBoundingClientRect().width || 1;

  const begin = (pointerId: number, x: number, y: number) => {
    if (!selected && !longPressed.current) swallowClick.current = false;
    pointers.current.set(pointerId, { x, y });
    if (selected || longPressed.current) { cancelHold(); resetBaseline(); return; }
    if (pointers.current.size === 1) {
      press.current = { x, y };
      cancelHold();
      hold.current = setTimeout(() => {
        if (!pointers.current.size) return;
        longPressed.current = true;
        swallowClick.current = true;
        interactionRef.current?.onSelectTransform(id);
        resetBaseline();
      }, LONG_PRESS_MS);
    }
  };
  const update = (pointerId: number, x: number, y: number) => {
    if (!pointers.current.has(pointerId)) return;
    pointers.current.set(pointerId, { x, y });
    if (!selected && !longPressed.current) {
      if (press.current && Math.hypot(x - press.current.x, y - press.current.y) > 8) cancelHold();
      return;
    }
    if (!baseline.current) resetBaseline();
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
    interactionRef.current?.onDrag?.(id,x,y);
  };
  const finish = (pointerId: number, x?: number, y?: number) => {
    cancelHold();
    if (!pointers.current.has(pointerId)) return;
    pointers.current.delete(pointerId);
    if (pointers.current.size) { resetBaseline(); return; }
    baseline.current = null;
    press.current = null;
    if (selected || longPressed.current) {
      const dropped=x!==undefined && y!==undefined &&
        interactionRef.current?.onDrop?.(id,x,y) === true;
      if (!dropped && JSON.stringify(current.current) !== JSON.stringify(saved || ZERO_TRANSFORM)) {
        interactionRef.current?.onCommitTransform(id, current.current);
      }
      swallowClick.current = true;
    }
    longPressed.current = false;
  };

  useEffect(() => {
    if (!selected || disabled || !node.current) return;
    const page = node.current.closest('.hn-carolina-page') as HTMLElement | null;
    if (!page) return;
    const outsideNode = (event: PointerEvent) =>
      !!node.current && !node.current.contains(event.target as Node);
    const down = (event: PointerEvent) => {
      if (!outsideNode(event) || !pointers.current.size) return;
      event.preventDefault(); event.stopPropagation();
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      page.setPointerCapture(event.pointerId);
      resetBaseline();
    };
    const move = (event: PointerEvent) => {
      if (outsideNode(event)) update(event.pointerId, event.clientX, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (outsideNode(event)) finish(event.pointerId,event.clientX,event.clientY);
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
  }, [selected, disabled]);

  const onPointerDown = (event: ReactPointerEvent<T>) => {
    if (disabled || !interaction || event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    begin(event.pointerId, event.clientX, event.clientY);
  };
  const onPointerMove = (event: ReactPointerEvent<T>) =>
    update(event.pointerId, event.clientX, event.clientY);
  const onPointerUp = (event: ReactPointerEvent<T>) => finish(event.pointerId,event.clientX,event.clientY);
  const onPointerCancel = (event: ReactPointerEvent<T>) => {
    // A system-cancelled gesture must never save or erase a photo.
    cancelHold();
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) { resetBaseline(); return; }
    baseline.current = null; press.current = null; longPressed.current = false;
    swallowClick.current = true;
    current.current = saved || ZERO_TRANSFORM;
    setLive(saved || ZERO_TRANSFORM);
  };
  const suppressTap = () => {
    if (selected) return true;
    if (!swallowClick.current) return false;
    swallowClick.current = false;
    return true;
  };
  const transform = 'translate(' + live.x + 'cqw, ' + live.y +
    'cqw) rotate(' + live.rotation + 'deg) scale(' + live.scale + ')';
  return { selected, transform, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, suppressTap };
}
