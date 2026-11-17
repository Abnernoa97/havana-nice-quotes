import type { Quote } from '../../quotes/types';
import type { CarolinaPageId } from '../../templates/carolina-layout';
import { carolinaPhotoOrder } from '../../templates/carolina-layout';
import { pageBackgroundMediaId } from '../../templates/page-background';
import { carolinaPhotos } from '../../templates/CarolinaTemplate';

export type PhotoLayer = {id:string;url:string;label:string;behindText:boolean};

/** Every photo that can be hidden behind another element stays reachable here. */
export function listPhotoLayers(item:Quote,page:CarolinaPageId):PhotoLayer[] {
  const backgroundId=pageBackgroundMediaId(item.designLayout,page);
  const layeredPhotos=(item.designLayout?.extraPhotos||[])
    .filter(photo=>photo.page===page && !!photo.url)
    .map((photo,index)=>({
      id:'photo-extra:'+photo.id,url:photo.url,
      label:photo.id===backgroundId?'Fondo de página':
        (photo.url.startsWith('/api/videos/')?'Video ':'Foto ')+(index+1),
      behindText:photo.id===backgroundId||
        !!item.designLayout?.photoStyles?.['photo-extra:'+photo.id]?.behindText,
    }));
  const backgroundCover=page===0 && (item.cover || item.coverVideo) &&
    item.designLayout?.photoStyles?.['photo:cover']?.behindText
    ? [{id:'photo:cover',url:item.coverVideo || item.cover,label:'Portada',behindText:true}] : [];
  const backgroundCollage=page===1
    ? carolinaPhotoOrder(item.designLayout).filter(slot=>!!carolinaPhotos(item)[slot] &&
        !!item.designLayout?.photoStyles?.['photo:'+slot]?.behindText)
        .map(slot=>({id:'photo:'+slot,url:carolinaPhotos(item)[slot],label:'Collage '+(slot+1),behindText:true}))
    : [];
  return [...backgroundCover,...backgroundCollage,...layeredPhotos];
}
