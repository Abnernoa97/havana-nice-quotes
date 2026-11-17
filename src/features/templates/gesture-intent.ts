/** Exactly one canvas action per pointer sequence.
 * One finger moves; two fingers lock either pinch zoom or an intentional twist.
 * Small rotational noise during pinch never changes the photo's angle. */
export type TwoFingerAction='pending'|'zoom'|'rotate';
export function shortestTurnDegrees(start:number,now:number):number{
 return ((now-start)*180/Math.PI+540)%360-180;
}
export function classifyTwoFingerAction(startDistance:number,nowDistance:number,turn:number):TwoFingerAction{
 if(startDistance<24)return 'pending';
 const scaleDelta=Math.abs(nowDistance/startDistance-1);
 // Zoom wins over rotation whenever the pinch changes separation meaningfully.
 if(scaleDelta>=.025)return 'zoom';
 if(Math.abs(turn)>=23 && scaleDelta<.025)return 'rotate';
 return 'pending';
}
export function snapToOrigin(value:number,threshold=1.1):number{
 return Math.abs(value)<threshold?0:value;
}
