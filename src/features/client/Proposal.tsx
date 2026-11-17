import type { Quote } from '../quotes/types';
import CarolinaDocument from '../templates/CarolinaTemplate';
import EditorialDocument from '../templates/EditorialTemplate';
import { templateFamily } from '../templates/template-registry';

type Props={item:Quote;styleName:string;embedded?:boolean};
/** Exactly the same editable pages are rendered in Design, Scroll and 3D. */
export default function Proposal({item,styleName,embedded=false}:Props){
 return <div className={embedded?'embedded':''}>
  {templateFamily(styleName)==='carolina'
    ? <CarolinaDocument item={item}/>
    : <EditorialDocument item={item}/>}
 </div>;
}
