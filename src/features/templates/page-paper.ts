import type {CSSProperties} from 'react';
import type {CarolinaLayout,CarolinaPageId,PagePaperTone} from './carolina-layout.ts';
import {carolinaPageOrder} from './carolina-layout.ts';
/** Absent means the original template background, never an implicit recolor. */
export const PAGE_PAPER_COLORS:Record<PagePaperTone,string>={
 white:'#ffffff',
 beige:'#f1ebdf',
};
export function pagePaperTone(layout:CarolinaLayout|undefined,page:CarolinaPageId):PagePaperTone|undefined{
 return layout?.pagePapers?.[String(page)];
}
export function pagePaperStyle(layout:CarolinaLayout|undefined,page:CarolinaPageId):CSSProperties|undefined{
 const tone=pagePaperTone(layout,page);
 return tone?{backgroundColor:PAGE_PAPER_COLORS[tone]}:undefined;
}
export function setPagePaperTone(layout:CarolinaLayout|undefined,page:CarolinaPageId,tone:PagePaperTone):CarolinaLayout{
 if(!carolinaPageOrder(layout).includes(page))return {...layout};
 return {...layout,pagePapers:{...layout?.pagePapers,[String(page)]:tone}};
}
export function setAllPagePaperTones(layout:CarolinaLayout|undefined,tone:PagePaperTone):CarolinaLayout{
 return {...layout,pagePapers:Object.fromEntries(
   carolinaPageOrder(layout).map(page=>[String(page),tone]))};
}
