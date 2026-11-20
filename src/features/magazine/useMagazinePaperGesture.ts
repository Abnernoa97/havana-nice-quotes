import {useRef} from 'react';
import type {RefObject,PointerEvent as ReactPointerEvent} from 'react';
import type {PageFlip} from '@gullabs/flipbook-core';
import {inPaperCorner,startsPaperFold,isVerticalReadingScroll,
  completesPaperTurn,isQuickPaperTap} from './magazine-gesture-intent';

type Point={x:number;y:number};
export type InteractiveMagazineFlip=PageFlip;
type TouchStart=Point&{id:number;at:number;corner:boolean;vertical:boolean;dragging:boolean};
type Args={
 mountRef:RefObject<HTMLDivElement|null>;
 flipRef:RefObject<PageFlip|null>;
 turningRef:RefObject<boolean>;
 orientation:string;
 changePage:(direction:'next'|'prev')=>void;
};
/** The same live drag mechanism as HAVANA NICE V2, scoped to the Quotes book.
 * The engine renders the paper, while React decides between scrolling,
 * a sustained corner fold and a quick tap. No second renderer or animation. */
export function useMagazinePaperGesture({mountRef,flipRef,turningRef,orientation,changePage}:Args){
 const touch=useRef<TouchStart|null>(null);
 const engine=()=>flipRef.current as InteractiveMagazineFlip|null;
 const relativePoint=(x:number,y:number):Point=>{
   const flip=engine();
   const rect=flip?.getBlockElement().getBoundingClientRect();
   return {x:rect?x-rect.left:0,y:rect?y-rect.top:0};
 };
 const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
   if(event.pointerType==='mouse'||!event.isPrimary||turningRef.current)return;
   if(event.target instanceof Element &&
     event.target.closest('button,a,input,textarea,[contenteditable]'))return;
   const rect=event.currentTarget.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   const x=(event.clientX-rect.left)/rect.width;
   const y=(event.clientY-rect.top)/rect.height;
   touch.current={id:event.pointerId,x:event.clientX,y:event.clientY,
     at:performance.now(),vertical:false,corner:inPaperCorner(x,y),dragging:false};
 };
 const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
   const start=touch.current;
   if(!start||start.id!==event.pointerId||start.vertical||turningRef.current)return;
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(isVerticalReadingScroll(dx,dy)){start.vertical=true;return;}
   if(!startsPaperFold(dx,dy,start.corner))return;
   const flip=engine();
   if(!flip)return;
   if(!start.dragging){
     flip.startUserTouch(relativePoint(start.x,start.y));
     start.dragging=true;
   }
   // Keep the leaf at the exact finger position, even if moved backwards/up.
   flip.userMove(relativePoint(event.clientX,event.clientY),true);
 };
 const onPointerUp=(event:ReactPointerEvent<HTMLDivElement>)=>{
   const start=touch.current;
   touch.current=null;
   if(!start||start.id!==event.pointerId||start.vertical||turningRef.current)return;
   if(start.dragging){
     const flip=engine();
     if(!flip)return;
     const dx=event.clientX-start.x,dy=event.clientY-start.y;
     const rect=event.currentTarget.getBoundingClientRect();
     const right=start.x>rect.left+rect.width*.5;
     const towardNext=right&&dx<0,towardPrev=!right&&dx>0;
     if(completesPaperTurn(dx,dy,rect.width,towardNext||towardPrev)){
       // V2 release behavior: cross the virtual spine before asking the engine
       // to stop, so a valid swipe completes rather than bouncing backwards.
       const bounds=flip.getBoundsRect();
       const over=Math.max(14,Math.min(30,bounds.pageWidth*.08));
       flip.userMove({
         x:bounds.left+bounds.pageWidth+(towardNext?-over:over),
         y:relativePoint(event.clientX,event.clientY).y,
       },true);
     }
     // Small movements naturally return the leaf; a deliberate one turns it.
     flip.userStop(relativePoint(event.clientX,event.clientY));
     return;
   }
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(Math.abs(dx)>=30&&Math.abs(dx)>Math.abs(dy)*1.2){
     changePage(dx<0?'next':'prev');
     return;
   }
   if(!isQuickPaperTap(dx,dy,performance.now()-start.at))return;
   const bounds=event.currentTarget.getBoundingClientRect();
   const x=bounds.width?(event.clientX-bounds.left)/bounds.width:0.5;
   changePage(x<(orientation==='landscape'?0.5:0.24)?'prev':'next');
 };
 const onPointerCancel=(event:ReactPointerEvent<HTMLDivElement>)=>{
   const start=touch.current;
   if(!start||start.id!==event.pointerId)return;
   touch.current=null;
   if(start.dragging)engine()?.userStop(relativePoint(event.clientX,event.clientY));
 };
 return {onPointerDown,onPointerMove,onPointerUp,onPointerCancel};
}
