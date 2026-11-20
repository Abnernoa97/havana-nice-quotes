import type { CarolinaTextInteraction } from '../../../templates/CarolinaTextNode';
import type { Quote } from '../../../quotes/types';
import type { CarolinaPageId } from '../../../templates/carolina-layout';
import { isBlankPage } from '../../../templates/carolina-layout';
import { EditorialCover, EditorialCollage, EditorialTerms } from '../../../templates/EditorialTemplate';
import { CarolinaCover, CarolinaCollage, CarolinaTerms, CarolinaBlankPage } from '../../../templates/CarolinaTemplate';
type Props={
  page:CarolinaPageId;cleanCarolina:boolean;editorial:boolean;renderItem:Quote;
  textInteraction:CarolinaTextInteraction;selectPhoto:(id:string)=>void;
};
/** Same quote model for editable page, Scroll and PageFlip 3D. */
export default function CanvasPageContent({page,cleanCarolina,editorial,renderItem,textInteraction,selectPhoto}:Props){
  return (
    <>
        {page===0 && !cleanCarolina && <div className="hn-canvas-cover">
          {editorial
            ? <EditorialCover item={renderItem} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
            : <CarolinaCover item={renderItem} interaction={textInteraction}
                onSelectCover={()=>selectPhoto('photo:cover')}
                onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
        </div>}
        {page===1 && !cleanCarolina && (editorial
          ? <EditorialCollage item={renderItem} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaCollage item={renderItem} interaction={textInteraction}
              onSelectPhoto={index=>selectPhoto('photo:'+index)}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {page===2 && !cleanCarolina && (editorial
          ? <EditorialTerms item={renderItem} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>
          : <CarolinaTerms item={renderItem} interaction={textInteraction}
              onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>)}
        {(isBlankPage(page)||cleanCarolina) && <CarolinaBlankPage item={renderItem} page={page}
          interaction={textInteraction} onSelectExtraPhoto={id=>selectPhoto('photo-extra:'+id)}/>}
    </>
  );
}
