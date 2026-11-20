import type { Dispatch, SetStateAction } from 'react';
import { isCarolinaCopyField } from '../../../templates/carolina-edit-fields';
import type { CarolinaTextField } from '../../../templates/carolina-edit-fields';
import type { CarolinaFixedKey, CarolinaLayout } from '../../../templates/carolina-layout';
import { carolinaPhotos } from '../../../templates/CarolinaTemplate';
import type { Quote } from '../../../quotes/types';

type SetValue<T> = Dispatch<SetStateAction<T>>;
type Params = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  updateLayout: (patch: Partial<CarolinaLayout>) => void;
  isPhotoId: (id:string) => boolean;
  setEditingId:SetValue<string|null>;
  setTransformingId:SetValue<string|null>;
  setLastTextId:SetValue<string|null>;
  setSelectedPhotoId:SetValue<string|null>;
  setPhotoLayersOpen:SetValue<boolean>;
  setTrashHovered:SetValue<boolean>;
  setError:SetValue<string>;
};
/** Remove layout references only. Media stays stored in R2; no alternate persistence path. */
export function createCanvasRemovalActions({
  item, edit, updateLayout, isPhotoId,
  setEditingId, setTransformingId, setLastTextId, setSelectedPhotoId,
  setPhotoLayersOpen, setTrashHovered, setError,
}:Params){
  const removeText = (id:string) => {
    if (!/^(fixed:[a-zA-Z]+|field:[a-z]+(?::cover)?|extra:[a-f0-9-]{36})$/.test(id)) return;
    const transforms={...item.designLayout?.transforms};
    const fonts={...item.designLayout?.fonts};
    const textStyles={...item.designLayout?.textStyles};
    delete transforms[id]; delete fonts[id]; delete textStyles[id];
    const clean={transforms,fonts,textStyles};
    if (id.startsWith('fixed:')) {
      const key=id.slice(6) as CarolinaFixedKey;
      updateLayout({...clean,fixed:{...item.designLayout?.fixed,[key]:''}});
    } else if (id.startsWith('extra:')) {
      updateLayout({...clean,extras:(item.designLayout?.extras||[])
        .filter(extra=>'extra:'+extra.id!==id)});
    } else {
      const field=id.slice(6).split(':')[0] as CarolinaTextField;
      if (field==='price' || field==='deposit') edit(field,0);
      else if (isCarolinaCopyField(field)) {
        edit('carolinaCopy',{...item.carolinaCopy,[field]:''});
      } else edit(field,'');
      updateLayout(clean);
    }
    setEditingId(null); setTransformingId(null); setLastTextId(null); setTrashHovered(false);
    setError('');
  };
  /** Only remove image references from the current quote; never delete its R2 media. */
  const removePhoto = (id:string) => {
    const transforms={...item.designLayout?.transforms};
    const photoStyles={...item.designLayout?.photoStyles};
    delete transforms[id]; delete photoStyles[id];
    if (id==='photo:cover') {
      edit('cover','');
      edit('coverVideo','');
      updateLayout({transforms,photoStyles});
    } else if (id.startsWith('photo-extra:')) {
      const photoId=id.slice('photo-extra:'.length);
      updateLayout({transforms,photoStyles,extraPhotos:(item.designLayout?.extraPhotos||[])
        .filter(photo=>photo.id!==photoId)});
    } else {
      const match=/^photo:(1[01]|[0-9])$/.exec(id);
      if (!match) return;
      const slot=Number(match[1]);
      const gallery=carolinaPhotos(item);
      gallery[slot]='';
      edit('gallery',gallery);
      // Keep the collage frame in place when its image is cleared.
      updateLayout({transforms,photoStyles});
    }
    setTransformingId(null);setSelectedPhotoId(null);setLastTextId(null);setPhotoLayersOpen(false);setTrashHovered(false);setError('');
  };
  const removeElement = (id:string) => isPhotoId(id) ? removePhoto(id) : removeText(id);
  return {removeText,removePhoto,removeElement};
}
