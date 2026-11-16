import type { Quote } from '../../quotes/types';
import type { CarolinaPageId } from '../../templates/carolina-layout';
import { carolinaPhotoOrder } from '../../templates/carolina-layout';
import { carolinaPhotos } from '../../templates/CarolinaTemplate';

export type PhotoLayer = {id:string;url:string;label:string;behindText:boolean};

/** Every photo that can be hidden behind another element stays reachable here. */
export function listPhotoLayers(item:Quote,page:CarolinaPageId):PhotoLayer[] {
  const layeredPhotos=(item.carolinaLayout?.extraPhotos||[])
    .filter(photo=>photo.page===page && !!photo.url)
    .map((photo,index)=>({
      id:'photo-extra:'+photo.id,url:photo.url,label:'Foto '+(index+1),
      behindText:!!item.carolinaLayout?.photoStyles?.['photo-extra:'+photo.id]?.behindText,
    }));
  const backgroundCover=page===0 && (item.cover || item.coverVideo) &&
    item.carolinaLayout?.photoStyles?.['photo:cover']?.behindText
    ? [{id:'photo:cover',url:item.coverVideo || item.cover,label:'Portada',behindText:true}] : [];
  const backgroundCollage=page===1
    ? carolinaPhotoOrder(item.carolinaLayout).filter(slot=>!!carolinaPhotos(item)[slot] &&
        !!item.carolinaLayout?.photoStyles?.['photo:'+slot]?.behindText)
        .map(slot=>({id:'photo:'+slot,url:carolinaPhotos(item)[slot],label:'Collage '+(slot+1),behindText:true}))
    : [];
  return [...backgroundCover,...backgroundCollage,...layeredPhotos];
}
