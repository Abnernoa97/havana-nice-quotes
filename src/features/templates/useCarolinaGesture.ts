import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { CarolinaTransform } from './carolina-layout';
import { ZERO_TRANSFORM, clampTransform } from './carolina-layout';
import { classifyTwoFingerAction, promoteZoomToRotation, shortestTurnDegrees, snapToOrigin, wrapRotation } from './gesture-intent';
import type { TwoFingerAction } from './gesture-intent';

export type CarolinaGestureInteraction = {
  transformingId: string | null;
  editingId?: string | null;
  onSelectTransform: (id: string) => void;
  onCommitTransform: (id: string, value: CarolinaTransform) => void;
  onDrag?: (id: string, x: number, y: number) => void;
  /** A second short tap on the selected layer finishes editing without moving it. */
  onDeselectTransform?: (id: string) => void;
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
  const selectedAtPress = useRef(false);
  const movedDuringPress = useRef(false);
  const pendingPageEdit = useRef(false);
  const twoFingerAction=useRef<TwoFingerAction>('pending');
  const previousAngle=useRef<number|null>(null);
  const cumulativeTurn=useRef(0);
  const pinchUsed=useRef(false);
  const selected = interaction?.transformingId === id;
  const editingHere = interaction?.editingId === id;
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;

  useEffect(() => {
    if (pointers.current.size) return;
    current.current = saved || ZERO_TRANSFORM;
    setLive(saved || ZERO_TRANSFORM);
  }, [saved?.x, saved?.y, saved?.scale, saved?.rotation]);
  useEffect(() => () => { if (hold.current) clearTimeout(hold.current); }, []);
  useEffect(() => {
    const element = node.current;
    if (!element || disabled || !interaction) return;
    // Native scroll is blocked only when a long press has intentionally armed the drag.
    const preventDragScroll = (event: TouchEvent) => {
      if (longPressed.current && event.cancelable) event.preventDefault();
    };
    element.addEventListener('touchmove', preventDragScroll, {passive:false});
    return () => element.removeEventListener('touchmove', preventDragScroll);
  }, [disabled, !!interaction]);

  const cancelHold = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; };
  const resetBaseline = () => {
    if (!pointers.current.size) return;
    const frame=geometry([...pointers.current.values()]);
    baseline.current={...frame,transform:{...current.current}};
    twoFingerAction.current='pending';
    previousAngle.current=pointers.current.size>=2?frame.angle:null;
    cumulativeTurn.current=0;
  };
  const beginEditDrag=(pointerId:number,x:number,y:number)=>{
    pendingPageEdit.current=true;
    press.current={x,y};
    pointers.current.set(pointerId,{x,y});
    selectedAtPress.current=false;
    movedDuringPress.current=false;
  };
  const finishEditTap=(pointerId:number)=>{
    pendingPageEdit.current=false;
    pointers.current.delete(pointerId);
    press.current=null;
  };
  const pageWidth = () => node.current?.closest('.hn-carolina-page')?.getBoundingClientRect().width || 1;

  const begin = (pointerId: number, x: number, y: number) => {
    if (!pointers.current.size) {
      selectedAtPress.current = interactionRef.current?.transformingId === id;
      movedDuringPress.current = false;
      pinchUsed.current=false;
    }
    if (!longPressed.current) swallowClick.current = false;
    pointers.current.set(pointerId, { x, y });
    if(pointers.current.size>1)pinchUsed.current=true;
    // A layer chosen explicitly from the layer list is ready to drag immediately.
    if (interactionRef.current?.transformingId===id) {
      longPressed.current = true;
      swallowClick.current = true;
    }
    if (longPressed.current) { cancelHold(); resetBaseline(); return; }
    if (pointers.current.size === 1) {
      press.current = { x, y };
      cancelHold();
      hold.current = setTimeout(() => {
        if (!pointers.current.size) return;
        longPressed.current = true;
        swallowClick.current = true;
        // Capture *after* the hold so vertical swipes can scroll the document natively.
        if (node.current?.isConnected) {
          try { node.current.setPointerCapture(pointerId); } catch { /* OS already cancelled */ }
        }
        interactionRef.current?.onSelectTransform(id);
        resetBaseline();
      }, LONG_PRESS_MS);
    }
  };
  const update = (pointerId: number, x: number, y: number) => {
    if(!pointers.current.has(pointerId))return;
    pointers.current.set(pointerId,{x,y});
    if(!longPressed.current){
      if(press.current&&Math.hypot(x-press.current.x,y-press.current.y)>8)cancelHold();
      return;
    }
    if(!baseline.current)resetBaseline();
    const b=baseline.current!;
    const now=geometry([...pointers.current.values()]);
    const isTwoFinger=pointers.current.size>=2;
    let mode:'move'|'zoom'|'rotate'='move';
    if(isTwoFinger){
      // Accumulate small angular changes so a full twist works past ±180 degrees.
      const previous=previousAngle.current;
      if(previous!==null)cumulativeTurn.current+=shortestTurnDegrees(previous,now.angle);
      previousAngle.current=now.angle;
      const turn=cumulativeTurn.current;
      if(twoFingerAction.current==='pending'){
        const intent=classifyTwoFingerAction(b.distance,now.distance,turn);
        if(intent==='pending')return;
        twoFingerAction.current=intent;
        movedDuringPress.current=true;
      }else if(twoFingerAction.current==='zoom' &&
        promoteZoomToRotation(b.distance,now.distance,turn)){
        // A zoom must not permanently steal a genuine rotation: switch once,
        // keeping the current scale and applying the accumulated twist.
        twoFingerAction.current='rotate';
      }
      mode=twoFingerAction.current;
    }
    const translateX=isTwoFinger?0:(now.x-b.x)*100/pageWidth();
    const translateY=isTwoFinger?0:(now.y-b.y)*100/pageWidth();
    const scale=isTwoFinger&&b.distance>24?now.distance/b.distance:1;
    const result=clampTransform({
      x:mode==='move'?snapToOrigin(b.transform.x+translateX):b.transform.x,
      y:mode==='move'?snapToOrigin(b.transform.y+translateY):b.transform.y,
      scale:mode==='zoom'?b.transform.scale*scale:
        mode==='rotate'?current.current.scale:b.transform.scale,
      rotation:mode==='rotate'
        ? wrapRotation(b.transform.rotation+cumulativeTurn.current)
        : b.transform.rotation,
    });
    if(JSON.stringify(result)===JSON.stringify(current.current))return;
    current.current=result;
    setLive(result);
    movedDuringPress.current=true;
    // Trash activation belongs ONLY to actual one-finger movement.
    interactionRef.current?.onDrag?.(id,mode==='move'?x:-1,mode==='move'?y:-1);
  };
  const finish = (pointerId: number, x?: number, y?: number) => {
    cancelHold();
    if (!pointers.current.has(pointerId)) return;
    pointers.current.delete(pointerId);
    if (pointers.current.size) { resetBaseline(); return; }
    baseline.current = null;
    press.current = null;
    if (longPressed.current) {
      const dropped=!pinchUsed.current && movedDuringPress.current &&
        x!==undefined && y!==undefined &&
        interactionRef.current?.onDrop?.(id,x,y) === true;
      const changed = JSON.stringify(current.current) !== JSON.stringify(saved || ZERO_TRANSFORM);
      if (!dropped && changed) {
        interactionRef.current?.onCommitTransform(id, current.current);
      } else if (!dropped && selectedAtPress.current && !movedDuringPress.current) {
        // This is a confirming tap, not a request to reopen the media/text editor.
        interactionRef.current?.onDeselectTransform?.(id);
      }
      swallowClick.current = true;
    }
    longPressed.current=false;
    pinchUsed.current=false;
    twoFingerAction.current='pending';
    previousAngle.current=null;
    cumulativeTurn.current=0;
  };

  // The selected element owns gestures that begin anywhere else on its page.
  // A freshly typed text can enter the same gesture on the first drag, without a hold.
  useEffect(() => {
    if ((!selected && !editingHere) || !node.current) return;
    const page = node.current.closest('.hn-carolina-page') as HTMLElement | null;
    if (!page) return;
    const outsideNode = (event: PointerEvent) =>
      !!node.current && !node.current.contains(event.target as Node);
    const isDeleteTarget = (event: PointerEvent) =>
      event.target instanceof Element && !!event.target.closest('[data-hn-text-trash]');
    const down = (event: PointerEvent) => {
      if (!outsideNode(event) || isDeleteTarget(event)) return;
      if (!pointers.current.size && interactionRef.current?.editingId===id) {
        // A tap outside still confirms. Movement of 7px turns it into an immediate drag.
        beginEditDrag(event.pointerId,event.clientX,event.clientY);
        return;
      }
      begin(event.pointerId,event.clientX,event.clientY);
      try { page.setPointerCapture(event.pointerId); } catch { /* OS cancelled */ }
    };
    const move = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      if (pendingPageEdit.current) {
        const start=press.current;
        if (!start || Math.hypot(event.clientX-start.x,event.clientY-start.y)<7) return;
        pendingPageEdit.current=false;
        cancelHold();
        longPressed.current=true;
        swallowClick.current=true;
        resetBaseline();
        interactionRef.current?.onSelectTransform(id);
        try {page.setPointerCapture(event.pointerId);}catch{/* OS cancelled */}
      }
      update(event.pointerId,event.clientX,event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      if (pendingPageEdit.current) {
        finishEditTap(event.pointerId);
        return;
      }
      finish(event.pointerId,event.clientX,event.clientY);
    };
    const cancel = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      cancelHold();
      pendingPageEdit.current=false;
      pointers.current.delete(event.pointerId);
      if (pointers.current.size) {resetBaseline();return;}
      baseline.current=null;press.current=null;longPressed.current=false;
      current.current=saved||ZERO_TRANSFORM;
      setLive(saved||ZERO_TRANSFORM);
    };
    page.addEventListener('pointerdown',down);
    page.addEventListener('pointermove',move);
    page.addEventListener('pointerup',up);
    page.addEventListener('pointercancel',cancel);
    return () => {
      page.removeEventListener('pointerdown',down);
      page.removeEventListener('pointermove',move);
      page.removeEventListener('pointerup',up);
      page.removeEventListener('pointercancel',cancel);
    };
  },[selected,editingHere,id]);

  const onPointerDown = (event: ReactPointerEvent<T>) => {
    if (!interaction || event.pointerType === 'mouse' && event.button !== 0) return;
    if(disabled && editingHere){
      // Touching the typed text is just as valid as starting on the background.
      beginEditDrag(event.pointerId,event.clientX,event.clientY);
      return;
    }
    if(disabled)return;
    begin(event.pointerId, event.clientX, event.clientY);
    // A previously armed layer is explicitly being moved; otherwise leave the
    // pointer unclaimed and allow native vertical scrolling / pointercancel.
    if (longPressed.current) event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<T>) =>
    update(event.pointerId, event.clientX, event.clientY);
  const onPointerUp = (event: ReactPointerEvent<T>) => {
    if(pendingPageEdit.current){finishEditTap(event.pointerId);return;}
    finish(event.pointerId,event.clientX,event.clientY);
  };
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
    if (!swallowClick.current) return false;
    swallowClick.current = false;
    return true;
  };
  const transform = 'translate(' + live.x + 'cqw, ' + live.y +
    'cqw) rotate(' + live.rotation + 'deg) scale(' + live.scale + ')';
  return { selected, transform, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, suppressTap };
}
