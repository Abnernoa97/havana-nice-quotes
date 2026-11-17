import type { Quote } from '../quotes/types';
import type { CarolinaTextInteraction } from './CarolinaTextNode';
import CarolinaPhotoNode from './CarolinaPhotoNode';

type Props={item:Quote;interaction?:CarolinaTextInteraction;onSelect?:()=>void};
/** One editable renderer for photo or video covers in Design, Scroll and 3D.
 * Effects, touch gestures and video visibility belong to CarolinaPhotoNode. */
export default function CoverMediaNode({item,interaction,onSelect}:Props){
  return <CarolinaPhotoNode cover id="photo:cover" url={item.coverVideo||item.cover}
    transform={item.designLayout?.transforms?.['photo:cover']}
    photoStyle={item.designLayout?.photoStyles?.['photo:cover']}
    interaction={interaction} onSelect={onSelect}/>;
}
