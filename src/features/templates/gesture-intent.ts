/** Exactly one canvas action per pointer sequence.
 * One finger moves; two fingers lock either pinch zoom or an intentional twist.
 * Small rotational noise during pinch never changes the photo's angle. */
export type TwoFingerAction='pending'|'zoom'|'rotate';
export function shortestTurnDegrees(start:number,now:number):number{
 return ((now-start)*180/Math.PI+540)%360-180;
}
/** Angular displacement is evaluated independently of the pinch distance:
 * during a real twist the fingertips seldom stay the same distance apart. */
export function classifyTwoFingerAction(startDistance:number,nowDistance:number,turn:number):TwoFingerAction{
 if(startDistance<24)return 'pending';
 const radial=Math.abs(Math.log(Math.max(nowDistance,1)/startDistance));
 const angular=Math.abs(turn)*Math.PI/180;
 const degrees=Math.abs(turn);
 // A clear twist takes precedence even if the fingers also move apart.
 if(degrees>=15 && (angular>=radial*1.25 || degrees>=42))return 'rotate';
 // Deliberate pinching is zoom, with a tolerance for slight finger-angle jitter.
 if(radial>=.05 && (degrees<15 || radial>=angular*1.5))return 'zoom';
 return 'pending';
}
/** If zoom was detected first, an increasingly obvious twist can take over.
 * This never demotes an active rotate gesture back to zoom. */
export function promoteZoomToRotation(startDistance:number,nowDistance:number,turn:number):boolean{
 if(startDistance<24||Math.abs(turn)<22)return false;
 const radial=Math.abs(Math.log(Math.max(nowDistance,1)/startDistance));
 const angular=Math.abs(turn)*Math.PI/180;
 return angular>=radial*1.15 || Math.abs(turn)>=50;
}
export function wrapRotation(degrees:number):number{
 return ((degrees+180)%360+360)%360-180;
}
export function snapToOrigin(value:number,threshold=1.1):number{
 return Math.abs(value)<threshold?0:value;
}
