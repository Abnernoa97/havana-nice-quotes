import type { Quote } from '../quotes/types';
import type { CarolinaTextInteraction } from './CarolinaTextNode';
import CarolinaTextNode from './CarolinaTextNode';
import CarolinaPhotoNode from './CarolinaPhotoNode';
import { carolinaPageOrder, fixedText } from './carolina-layout';
import type { CarolinaFixedKey } from './carolina-layout';
import { CarolinaCollage, ExtraPhotos, ExtraTexts, carolinaDate } from './CarolinaTemplate';
import { money } from '../../shared/lib/formatters';
import './editorial-template.css';

type Props={item:Quote;interaction?:CarolinaTextInteraction;onSelectCover?:()=>void;
 onSelectPhoto?:(index:number)=>void;onSelectExtraPhoto?:(id:string)=>void};
function Node({item,id,value,interaction}:{
 item:Quote;id:string;value:string;interaction?:CarolinaTextInteraction;
}){
 return <CarolinaTextNode id={id} text={value} interaction={interaction}
  transform={item.carolinaLayout?.transforms?.[id]}
  fontId={item.carolinaLayout?.fonts?.[id]||item.carolinaLayout?.defaultFont}
  textStyle={item.carolinaLayout?.textStyles?.[id]}/>;
}
function Fixed({item,name,interaction}:{
 item:Quote;name:CarolinaFixedKey;interaction?:CarolinaTextInteraction;
}){
 return <Node item={item} id={'fixed:'+name}
  value={fixedText(item.carolinaLayout,name)} interaction={interaction}/>;
}
const skin=(item:Quote)=>'hn-style-'+(item.style||'libre');

/** Page 1: a distinct visual skin, with the same editable IDs and photo engine. */
export function EditorialCover({item,interaction,onSelectCover,onSelectExtraPhoto}:Props){
 return <div className={'hn-carolina-page hn-editorial-page hn-editorial-cover '+skin(item)+
   (interaction?.transformingId?' hn-layout-grid':'')}>
   <CarolinaPhotoNode id="photo:cover" url={item.cover} cover
    transform={item.carolinaLayout?.transforms?.['photo:cover']}
    photoStyle={item.carolinaLayout?.photoStyles?.['photo:cover']}
    interaction={interaction} onSelect={onSelectCover}/>
   <div className="hn-editorial-photo-shade"/>
   <div className="hn-editorial-top">
    <strong><Fixed item={item} name="brand" interaction={interaction}/></strong>
    <small><Fixed item={item} name="subtitle" interaction={interaction}/></small>
   </div>
   <div className="hn-editorial-hero">
    <div className="hn-editorial-intro">
      <Fixed item={item} name="celebration" interaction={interaction}/>
    </div>
    <h1><Node item={item} id="field:name" value={item.name} interaction={interaction}/></h1>
    <p><Node item={item} id="field:note" value={item.note} interaction={interaction}/></p>
    <small>
     <Node item={item} id="field:location:cover" value={item.location} interaction={interaction}/>
     <span aria-hidden="true"> · </span>
     <Node item={item} id="field:date:cover" value={carolinaDate(item.date)} interaction={interaction}/>
    </small>
   </div>
   <ExtraPhotos item={item} page={0} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
   <ExtraTexts item={item} page={0} interaction={interaction}/>
 </div>;
}

/** Page 2: the existing movable photo grid. No alternative implementation of photo effects. */
export function EditorialCollage({item,interaction,onSelectPhoto,onSelectExtraPhoto}:Props){
 return <div className={'hn-editorial-collage '+skin(item)}>
  <CarolinaCollage item={item} interaction={interaction}
    onSelectPhoto={onSelectPhoto} onSelectExtraPhoto={onSelectExtraPhoto}/>
 </div>;
}

/** Page 3: terms, package and pricing use precisely the same editing contract. */
export function EditorialTerms({item,interaction,onSelectExtraPhoto}:Props){
 return <div className={'hn-carolina-page hn-editorial-page hn-editorial-terms '+skin(item)+
   (interaction?.transformingId?' hn-layout-grid':'')}>
   <div className="hn-editorial-rule">
     <Fixed item={item} name="brand" interaction={interaction}/>
   </div>
   <div className="hn-editorial-story">
    <div className="hn-editorial-eyebrow">
      <Fixed item={item} name="experience" interaction={interaction}/>
    </div>
    <h2><Fixed item={item} name="production" interaction={interaction}/></h2>
    <p><Node item={item} id="field:desc" value={item.desc} interaction={interaction}/></p>
    <div className="hn-editorial-divider"/>
    <div className="hn-editorial-package">
      <small><Fixed item={item} name="service" interaction={interaction}/></small>
      <strong><Node item={item} id="field:package" value={item.package} interaction={interaction}/></strong>
    </div>
    <div className="hn-editorial-divider"/>
    <div className="hn-editorial-finance">
      <div><small><Fixed item={item} name="investment" interaction={interaction}/></small>
       <strong><Node item={item} id="field:price" value={money(item.price,item.currency)} interaction={interaction}/></strong>
      </div>
      <div><small><Fixed item={item} name="depositBefore" interaction={interaction}/></small>
       <strong><Node item={item} id="field:deposit" value={item.deposit+'%'} interaction={interaction}/></strong>
      </div>
    </div>
   </div>
   <div className="hn-editorial-signoff">
     <Fixed item={item} name="subtitle" interaction={interaction}/>
   </div>
   <ExtraPhotos item={item} page={2} interaction={interaction} onSelectPhoto={onSelectExtraPhoto}/>
   <ExtraTexts item={item} page={2} interaction={interaction}/>
 </div>;
}

/** The same three page components are used in the designer, client Scroll and PageFlip. */
export default function EditorialDocument({item}:{item:Quote}){
 return <div className={'hn-editorial-document '+skin(item)}>
  {carolinaPageOrder(item.carolinaLayout).map(page=>
    page===0?<EditorialCover key={page} item={item}/>:
    page===1?<EditorialCollage key={page} item={item}/>:
    <EditorialTerms key={page} item={item}/>)}
 </div>;
}
