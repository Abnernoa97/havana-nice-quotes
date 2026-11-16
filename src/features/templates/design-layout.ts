import type { Quote } from '../quotes/types';
import type { CarolinaLayout } from './carolina-layout';
/** Shared persisted layout, compatible with the old Carolina shape and element IDs. */
export type DesignLayout=CarolinaLayout;
export function getDesignLayout(quote:Pick<Quote,'designLayout'|'carolinaLayout'>):DesignLayout|undefined{
 return quote.designLayout ?? quote.carolinaLayout;
}
/** Non-destructive legacy read adapter: never rewrite or delete saved layouts. */
export function withDesignLayout<T extends Quote>(quote:T):T{
 const layout=getDesignLayout(quote);
 return layout===quote.carolinaLayout?quote:{...quote,carolinaLayout:layout};
}
