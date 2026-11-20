import type { Quote } from '../../../quotes/types';
import { carolinaPhotos } from '../../../templates/CarolinaTemplate';
/** One photo resolver for both selection and the immersive editor. */
export function canvasPhotoUrl(item:Quote,id:string):string{
  if(id==='photo:cover')return item.coverVideo || item.cover || '';
  if(id.startsWith('photo-extra:'))
    return item.designLayout?.extraPhotos?.find(p=>'photo-extra:'+p.id===id)?.url || '';
  const match=/^photo:(1[01]|[0-9])$/.exec(id);
  return match ? carolinaPhotos(item)[Number(match[1])] || '' : '';
}
