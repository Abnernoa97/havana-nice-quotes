/** A vertical swipe is navigation, not an edit. The editor owns only clear horizontal gestures. */
export function pointerIntent(dx:number,dy:number):'pending'|'horizontal'|'vertical' {
  const x=Math.abs(dx),y=Math.abs(dy);
  if(Math.max(x,y)<9)return 'pending';
  if(y>x*1.1)return 'vertical';
  if(x>y*1.1)return 'horizontal';
  return 'pending';
}
