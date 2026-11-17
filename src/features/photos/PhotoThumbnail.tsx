import {useState} from 'react';
import type {CloudPhoto} from './useMediaLibrary';
import {queuePhotoThumbnail} from './photo-thumbnails';
type Props={photo:CloudPhoto;priority?:boolean};
/** Tiny JPEG where available; transparently backfills legacy photos once. */
export default function PhotoThumbnail({photo,priority=false}:Props){
 const [fallback,setFallback]=useState(false);
 return <img src={!fallback&&photo.thumbnailUrl?photo.thumbnailUrl:photo.url}
   alt="" loading={priority?'eager':'lazy'} decoding="async" draggable={false}
   fetchPriority={priority?'high':'auto'}
   onError={()=>{if(!fallback)setFallback(true);}}
   onLoad={event=>{
    if(fallback&&photo.thumbnailUrl)queuePhotoThumbnail(photo.id,event.currentTarget);
   }}/>;
}
