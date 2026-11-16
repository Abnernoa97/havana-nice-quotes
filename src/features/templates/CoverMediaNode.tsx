import type { Quote } from '../quotes/types';
import type { CarolinaTextInteraction } from './CarolinaTextNode';
import CarolinaPhotoNode from './CarolinaPhotoNode';
import './cover-media.css';

type Props={item:Quote;interaction?:CarolinaTextInteraction;onSelect?:()=>void};
/** Single cover renderer for every template, the editor, Scroll and the 3D source.
 * A web video is a playable HTML media element, not a broken image background.
 * Keep the photo editor untouched; videos have their own native sound controls. */
export default function CoverMediaNode({item,interaction,onSelect}:Props){
  const video=item.coverVideo;
  if(video){
    return <div className="hn-carolina-cover-photo hn-cover-video-frame"
      data-hn-photo-id="photo:cover" aria-label="Video de portada">
      <video className="hn-cover-video" src={video} preload="metadata"
        controls playsInline loop aria-label="Reproducir video de portada"/>
      <span className="hn-carolina-photo-shade" aria-hidden="true"/>
    </div>;
  }
  return <CarolinaPhotoNode cover id="photo:cover" url={item.cover}
    transform={item.carolinaLayout?.transforms?.['photo:cover']}
    photoStyle={item.carolinaLayout?.photoStyles?.['photo:cover']}
    interaction={interaction} onSelect={onSelect}/>;
}
