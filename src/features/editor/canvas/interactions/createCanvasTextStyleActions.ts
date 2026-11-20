import type { ElegantFontId } from '../../../templates/elegant-fonts';
import type { CarolinaLayout, CarolinaTextStyle } from '../../../templates/carolina-layout';
import type { Quote } from '../../../quotes/types';

type Params = {
  item:Quote;
  lastTextId:string|null;
  updateLayout:(patch:Partial<CarolinaLayout>)=>void;
};
/** Styles remain scoped to the selected text; the existing designLayout is the single source. */
export function createCanvasTextStyleActions({item,lastTextId,updateLayout}:Params){
  const chooseFont = (font:ElegantFontId|null) => {
    if (!lastTextId) return;
    const fonts={...item.designLayout?.fonts};
    if (font) fonts[lastTextId]=font;
    else delete fonts[lastTextId];
    updateLayout({fonts});
  };
  const changeTextStyle = (key:keyof CarolinaTextStyle,value:string|number|undefined) => {
    if (!lastTextId) return;
    const textStyles={...item.designLayout?.textStyles};
    const next:CarolinaTextStyle={...textStyles[lastTextId]};
    if (value===undefined) delete next[key];
    else if (key==='color' && typeof value==='string') next.color=value;
    else if (key==='size' && typeof value==='number') next.size=value;
    else if (key==='stretchX' && typeof value==='number') next.stretchX=value;
    else if (key==='stretchY' && typeof value==='number') next.stretchY=value;
    if (Object.keys(next).length) textStyles[lastTextId]=next;
    else delete textStyles[lastTextId];
    updateLayout({textStyles});
  };
  return {chooseFont,changeTextStyle};
}
