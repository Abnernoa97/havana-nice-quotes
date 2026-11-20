/** Paper interaction thresholds adopted from HAVANA NICE V2.
 * Keep vertical scrolling native; only a deliberate corner drag owns the curl. */
export const inPaperCorner=(x:number,y:number):boolean=>
  (x<0.14||x>0.86)&&(y<0.23||y>0.77);
export const startsPaperFold=(dx:number,dy:number,corner:boolean):boolean=>
  corner&&Math.abs(dx)>=12&&Math.abs(dx)>Math.abs(dy)*1.2;
export const isVerticalReadingScroll=(dx:number,dy:number):boolean=>
  Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.15;
export const completesPaperTurn=(dx:number,dy:number,stageWidth:number,
  towardPage:boolean):boolean=>
  towardPage&&Math.abs(dx)>=Math.min(54,Math.max(38,stageWidth*.1))&&
  Math.abs(dx)>Math.abs(dy)*1.2;
export const isQuickPaperTap=(dx:number,dy:number,elapsedMs:number):boolean=>
  Math.abs(dx)<=7&&Math.abs(dy)<=7&&elapsedMs<=650;
