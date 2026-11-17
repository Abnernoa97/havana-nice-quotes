import type { CarolinaLayout, CarolinaPageId, PageKind } from './carolina-layout.ts';
import { carolinaPageOrder, isBlankPage, MAX_DESIGN_ELEMENTS, MAX_DESIGN_PAGE_ID, MAX_DESIGN_PAGES } from './carolina-layout.ts';

/** A page is a stable numeric ID, never a slide index or a cloned React tree.
 * All editing, Scroll and the 3D magazine consume this same order. */
export type PageChange={layout:CarolinaLayout;page:CarolinaPageId};
const nextPageId=(pages:number[]):number|null=>{
 const next=Math.max(2,...pages)+1;
 return next<=MAX_DESIGN_PAGE_ID?next:null;
};
export function insertBlankPage(layout:CarolinaLayout|undefined,after?:number,kind?:PageKind):PageChange|null{
 const pages=carolinaPageOrder(layout);
 if(pages.length>=MAX_DESIGN_PAGES)return null;
 const page=nextPageId(pages);
 if(page===null)return null;
 const where=after===undefined?pages.length:pages.indexOf(after)+1;
 pages.splice(where||pages.length,0,page);
 return {layout:{...layout,pageOrder:pages,...(kind?{pageKinds:{...layout?.pageKinds,[page]:kind}}:{})},page};
}
export function shiftPage(layout:CarolinaLayout|undefined,page:number,step:-1|1):CarolinaLayout|null{
 const order=carolinaPageOrder(layout);
 const index=order.indexOf(page),to=index+step;
 if(index<0||to<0||to>=order.length)return null;
 [order[index],order[to]]=[order[to],order[index]];
 return {...layout,pageOrder:order};
}
/** Removing a page discards only its canvas layers and styling; uploaded R2 photos are untouched. */
export function removeDesignPage(layout:CarolinaLayout|undefined,page:number):PageChange|null{
 const order=carolinaPageOrder(layout);
 if(order.length<=1||!order.includes(page))return null;
 const index=order.indexOf(page);
 const nextOrder=order.filter(value=>value!==page);
 const removedText=(layout?.extras||[]).filter(x=>x.page===page);
 const removedPhotos=(layout?.extraPhotos||[]).filter(x=>x.page===page);
 const removedIds=new Set([
  ...removedText.map(x=>'extra:'+x.id),
  ...removedPhotos.map(x=>'photo-extra:'+x.id),
 ]);
 const pageKinds={...layout?.pageKinds};delete pageKinds[String(page)];
 const clean=<T,>(map:Record<string,T>|undefined):Record<string,T>=>{
  const result={...map};
  for(const id of removedIds)delete result[id];
  return result;
 };
 return {layout:{...layout,pageOrder:nextOrder,pageKinds,
  extras:(layout?.extras||[]).filter(x=>x.page!==page),
  extraPhotos:(layout?.extraPhotos||[]).filter(x=>x.page!==page),
  transforms:clean(layout?.transforms),fonts:clean(layout?.fonts),
  textStyles:clean(layout?.textStyles),photoStyles:clean(layout?.photoStyles)},
  page:nextOrder[Math.min(index,nextOrder.length-1)]};
}
/** Duplicate only freeform pages. Built-in cover/collage/terms remain single-source. */
export function duplicateBlankPage(layout:CarolinaLayout|undefined,page:number):PageChange|null{
 if(!isBlankPage(page))return null;
 const texts=(layout?.extras||[]).filter(e=>e.page===page);
 const photos=(layout?.extraPhotos||[]).filter(p=>p.page===page);
 if((layout?.extras?.length||0)+texts.length>MAX_DESIGN_ELEMENTS ||
    (layout?.extraPhotos?.length||0)+photos.length>MAX_DESIGN_ELEMENTS)return null;
 const inserted=insertBlankPage(layout,page,layout?.pageKinds?.[String(page)]);
 if(!inserted)return null;
 const ids=new Map<string,string>();
 const extras=texts.map(e=>{
  const id=crypto.randomUUID();ids.set('extra:'+e.id,'extra:'+id);
  return {...e,id,page:inserted.page};
 });
 const extraPhotos=photos.map(p=>{
  const id=crypto.randomUUID();ids.set('photo-extra:'+p.id,'photo-extra:'+id);
  return {...p,id,page:inserted.page};
 });
 const cloneMap=<T,>(source:Record<string,T>|undefined):Record<string,T>=>{
  const result={...source};
  for(const [oldId,newId] of ids){
   const value=source?.[oldId];
   if(value!==undefined)result[newId]=(typeof value==='object' && value!==null
     ? {...value} : value) as T;
  }
  return result;
 };
 return {page:inserted.page,layout:{...inserted.layout,
  extras:[...(layout?.extras||[]),...extras],
  extraPhotos:[...(layout?.extraPhotos||[]),...extraPhotos],
  transforms:cloneMap(layout?.transforms),fonts:cloneMap(layout?.fonts),
  textStyles:cloneMap(layout?.textStyles),photoStyles:cloneMap(layout?.photoStyles)}};
}
