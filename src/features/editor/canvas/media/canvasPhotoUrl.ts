import type { Quote } from '../../../quotes/types';
import { carolinaPhotos } from '../../../templates/CarolinaTemplate';
import { canvasPhotoTarget } from './canvasPhotoTarget';

/** One resolver for the picker and immersive workspace, including cover videos. */
export function canvasPhotoUrl(item:Quote,id:string):string{
  const target=canvasPhotoTarget(id);
  if(target==='cover')return item.coverVideo || item.cover || '';
  if(typeof target==='string')
    return item.designLayout?.extraPhotos?.find(p=>p.id===target.slice(6))?.url || '';
  return typeof target==='number' ? carolinaPhotos(item)[target] || '' : '';
}
