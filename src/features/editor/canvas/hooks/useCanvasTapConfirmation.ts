import { useEffect, useRef } from 'react';
import type { TextToolTab } from '../../texts/TextStyleDock';
/** One intentional tap confirms; swipes and multi-touch never confirm. */
export function useCanvasTapConfirmation(transformingId:string|null,activeTextTool:TextToolTab|null,editingId:string|null,clearSelection:()=>void):void{
  // A page transform is confirmed by a short tap anywhere on the app.
  // Swiping to scroll or using a second finger must never confirm by accident.
  const blockClickUntil=useRef(0);
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(Date.now()>blockClickUntil.current)return;
      blockClickUntil.current=0;
      event.preventDefault();event.stopPropagation();
    };
    document.addEventListener('click',onClick,true);
    return ()=>document.removeEventListener('click',onClick,true);
  },[]);
  useEffect(()=>{
    if(!transformingId&&!activeTextTool)return;
    let candidate:{id:number;x:number;y:number;insideSheet:boolean}|null=null;
    const down=(event:PointerEvent)=>{
      if(!(event.target instanceof Element)||event.button!==0)return;
      const el=event.target;
      // Switching tools uses the same tap: never swallow toolbar or navigation clicks.
      // A tap on empty canvas still confirms the current transform.
      if(el.closest('.hn-canvas-toolbar,.hn-canvas-pager,.hn-text-dock,.hn-photo-workspace,.edit-tabs,.editor-actions,[data-hn-text-trash]'))return;
      if(candidate){candidate=null;return;} // multiple fingers are not a confirming tap
      candidate={id:event.pointerId,x:event.clientX,y:event.clientY,
        insideSheet:!!el.closest('.hn-canvas-sheet')};
      if(activeTextTool){event.preventDefault();event.stopPropagation();}
    };
    const move=(event:PointerEvent)=>{
      if(candidate?.id===event.pointerId&&
        Math.hypot(event.clientX-candidate.x,event.clientY-candidate.y)>9)candidate=null;
    };
    const up=(event:PointerEvent)=>{
      if(candidate?.id!==event.pointerId)return;
      const original=candidate;candidate=null;
      if(Math.hypot(event.clientX-original.x,event.clientY-original.y)>9)return;
      if(editingId&&document.activeElement instanceof HTMLElement)document.activeElement.blur();
      blockClickUntil.current=Date.now()+650;
      clearSelection();
      // Inside the page, allow the gesture hook to receive pointerup and release
      // capture. Only swallow the eventual click so no other edit opens.
      if(!original.insideSheet || activeTextTool){
        event.preventDefault();event.stopPropagation();
      }
    };
    const cancel=()=>{candidate=null;};
    document.addEventListener('pointerdown',down,true);
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerup',up,true);
    document.addEventListener('pointercancel',cancel,true);
    return ()=>{
      document.removeEventListener('pointerdown',down,true);
      document.removeEventListener('pointermove',move,true);
      document.removeEventListener('pointerup',up,true);
      document.removeEventListener('pointercancel',cancel,true);
    };
  },[transformingId,activeTextTool,editingId]);
}
