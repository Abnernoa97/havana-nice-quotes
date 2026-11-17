import {useEffect,useRef} from 'react';
import type { Quote } from '../quotes/types';
import type { CarolinaTextInteraction } from './CarolinaTextNode';
import CarolinaPhotoNode from './CarolinaPhotoNode';
import './cover-media.css';

type Props={item:Quote;interaction?:CarolinaTextInteraction;onSelect?:()=>void};
/** Single cover renderer for every template, the editor, Scroll and the 3D source.
 * A web video is a playable HTML media element, not a broken image background.
 * Keep the photo editor untouched. Muted playback permits mobile autoplay; audio remains in R2. */
export default function CoverMediaNode({item,interaction,onSelect}:Props){
  const player=useRef<HTMLVideoElement>(null);
  const video=item.coverVideo;
  useEffect(()=>{
    const media=player.current;
    if(!media||!video)return;
    // Avoid decoding hidden Scroll and designer previews. FlipMagazine owns the
    // lifecycle of its cloned leaves; the hidden React source never plays.
    if(typeof IntersectionObserver==='undefined') {
      if(!document.hidden)void media.play().catch(()=>{});
      return ()=>media.pause();
    }
    let inView=false;
    const sync=()=>{
      if(inView&&!document.hidden)void media.play().catch(()=>{});
      else media.pause();
    };
    const observer=new IntersectionObserver(entries=>{
      inView=Boolean(entries[0]?.isIntersecting);
      sync();
    },{threshold:.05});
    observer.observe(media);
    document.addEventListener('visibilitychange',sync);
    return ()=>{
      observer.disconnect();
      document.removeEventListener('visibilitychange',sync);
      media.pause();
    };
  },[video]);
  if(video){
    return <div className="hn-carolina-cover-photo hn-cover-video-frame"
      data-hn-photo-id="photo:cover" aria-label="Video de portada">
      <video ref={player} className="hn-cover-video" src={video} preload="auto"
        autoPlay muted loop playsInline disablePictureInPicture
        aria-hidden="true" tabIndex={-1}/>
      <span className="hn-carolina-photo-shade" aria-hidden="true"/>
    </div>;
  }
  return <CarolinaPhotoNode cover id="photo:cover" url={item.cover}
    transform={item.designLayout?.transforms?.['photo:cover']}
    photoStyle={item.designLayout?.photoStyles?.['photo:cover']}
    interaction={interaction} onSelect={onSelect}/>;
}
