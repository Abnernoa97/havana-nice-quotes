/** The same crop coordinates are used by touch controls and the saved reader view. */
export const CROP_ASPECT_RATIOS={frame:1,'1:1':1,'4:5':4/5,'9:16':9/16,'16:9':16/9} as const;
export type CropAspect=keyof typeof CROP_ASPECT_RATIOS;
export type CropValues={cropX:number;cropY:number;cropZoom:number};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function clampCrop(v:CropValues):CropValues{return {cropX:Math.round(clamp(v.cropX,0,100)),cropY:Math.round(clamp(v.cropY,0,100)),cropZoom:Math.round(clamp(v.cropZoom,100,300))};}
export function panCrop(v:CropValues,dx:number,dy:number,w:number,h:number):CropValues{
  const zoom=v.cropZoom<=100&&(Math.abs(dx)>4||Math.abs(dy)>4)?125:v.cropZoom;
  const overscan=Math.max(.25,zoom/100-1);
  return clampCrop({cropZoom:zoom,cropX:v.cropX-dx*100/(Math.max(1,w)*overscan),cropY:v.cropY-dy*100/(Math.max(1,h)*overscan)});
}
export function pinchCrop(v:CropValues,d0:number,d1:number):CropValues{return d0>0?clampCrop({...v,cropZoom:v.cropZoom*d1/d0}):clampCrop(v);}
export function handleCropZoom(v:CropValues,corner:string,dx:number,dy:number,w:number,h:number):CropValues{
  const sx=corner.includes('left')?1:-1,sy=corner.includes('top')?1:-1;
  return clampCrop({...v,cropZoom:v.cropZoom+200*(sx*dx/Math.max(1,w)+sy*dy/Math.max(1,h))});
}

/** Rotate the image content without moving the frame; wrap safely across ±180°. */
export function normalizeCropRotation(degrees:number):number {
  if(!Number.isFinite(degrees)) return 0;
  return Math.round((((degrees+180)%360)+360)%360-180);
}
export function rotateCrop(startDegrees:number,startAngleRadians:number,currentAngleRadians:number):number {
  const delta=((currentAngleRadians-startAngleRadians)*180/Math.PI+540)%360-180;
  return normalizeCropRotation(startDegrees+delta);
}
