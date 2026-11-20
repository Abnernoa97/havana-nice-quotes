import type { PhotoTarget } from '../../shared/editor-types';

/** Shared mapping from canvas element IDs to the existing media picker targets. */
export function canvasPhotoTarget(id:string):PhotoTarget|null{
  if(id==='photo:cover')return 'cover';
  if(id.startsWith('photo-extra:')){
    const extraId=id.slice('photo-extra:'.length);
    return extraId ? `extra:${extraId}` : null;
  }
  const slot=/^photo:(1[01]|[0-9])$/.exec(id);
  return slot ? Number(slot[1]) : null;
}
