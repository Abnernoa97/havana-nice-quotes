import { Check, Images, Smartphone, X, Clapperboard } from 'lucide-react';
import PhotoThumbnail from '../../photos/PhotoThumbnail';
import VideoPoster from '../../videos/VideoPoster';
import { useState } from 'react';
import { useCloudVideoOptions } from '../../videos/useCloudVideoOptions';
import type { Quote } from '../../quotes/types';
import type { CloudPhoto } from '../../photos/useMediaLibrary';
import type { PhotoTarget } from '../shared/editor-types';
import './photo-source-picker.css';

type Props = {
  target:PhotoTarget;item:Quote;photos:CloudPhoto[];busy:boolean;bank:boolean;error:string;
  onClose:()=>void;onToggleBank:()=>void;
  onPhoneFile:(file?:File)=>void;onChoose:(url:string)=>void;
  onChooseVideo?:(url:string)=>void;
};
export default function PhotoSourcePicker({
  target,item,photos,busy,bank,error,onClose,onToggleBank,onPhoneFile,onChoose,onChooseVideo,
}:Props){
  const cover=target==='cover';
  const canPickVideo=cover||(typeof target==='string'&&target.startsWith('extra:'));
  const [kind,setKind]=useState<'photos'|'videos'>('photos');
  const cloudVideos=useCloudVideoOptions(canPickVideo&&bank&&kind==='videos');
  return <div className="hn-canvas-shade" onClick={event=>{
      if(event.target===event.currentTarget)onClose();
    }}>
    <div className="hn-canvas-picker" role="dialog" aria-modal="true"
      aria-label={cover?'Archivo de portada':typeof target==='string'?'Foto o video adicional':'Foto '+(target+1)}>
      <header><strong>{cover?'Archivo de portada':typeof target==='string'?'Foto o video adicional':'Foto '+(target+1)}</strong>
        <button type="button" disabled={busy} aria-label="Cerrar" onClick={onClose}><X size={19}/></button>
      </header>
      <div className="hn-canvas-sources">
        <label className="hn-canvas-source"><Smartphone size={21}/> Mi teléfono
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            disabled={busy} onChange={e=>{
              const file=e.target.files?.[0];e.target.value='';onPhoneFile(file);
            }}/>
        </label>
        <button type="button" className={bank?'hn-canvas-source selected':'hn-canvas-source'}
          disabled={busy} onClick={onToggleBank}><Images size={21}/> {canPickVideo?'Banco de medios':'Banco de fotos'}</button>
      </div>
      {bank && <>
        {canPickVideo&&<div className="hn-canvas-cloud-categories" role="group" aria-label="Tipo de archivo en la nube">
          <button type="button" className={kind==='photos'?'active':''}
            aria-pressed={kind==='photos'} onClick={()=>setKind('photos')}>
            <Images size={16}/> Fotografías
          </button>
          <button type="button" className={kind==='videos'?'active':''}
            aria-pressed={kind==='videos'} onClick={()=>setKind('videos')}>
            <Clapperboard size={16}/> Videos
          </button>
        </div>}
        {(!canPickVideo||kind==='photos')&&<div className="hn-canvas-bank">
          {photos.map(photo=><button type="button" key={photo.id} disabled={busy}
            aria-label={'Elegir '+photo.name} onClick={()=>onChoose(photo.url)}>
            <PhotoThumbnail photo={photo}/>
            {(cover?item.cover===photo.url&&!item.coverVideo:
              typeof target==='string'?item.designLayout?.extraPhotos?.some(extra=>
                extra.id===target.slice(6)&&extra.url===photo.url):
              (item.gallery||[])[target as number]===photo.url)&&<Check size={16}/>}
          </button>)}
          {!photos.length&&<p>Tu banco de fotografías está vacío.</p>}
        </div>}
        {canPickVideo&&kind==='videos'&&<div className="hn-canvas-cloud-videos" aria-label="Videos en la nube">
          {cloudVideos.videos.map(video=><button type="button" key={video.id}
             className="hn-canvas-cloud-video" disabled={busy}
             aria-label={'Elegir video '+video.name} onClick={()=>onChooseVideo?.(video.url)}>
            <div className="hn-canvas-cloud-video-preview">
              <VideoPoster video={video}/>
              {(cover ? item.coverVideo===video.url :
                typeof target==='string'&&item.designLayout?.extraPhotos?.some(extra=>
                  extra.id===target.slice(6)&&extra.url===video.url))&&
                <Check size={16} className="hn-cover-selected"/>}
            </div>
          </button>)}
          {cloudVideos.loading&&<p>Cargando videos…</p>}
          {cloudVideos.error&&<p role="alert">{cloudVideos.error}</p>}
          {!cloudVideos.loading&&!cloudVideos.error&&!cloudVideos.videos.length&&
            <p>Aún no hay videos convertidos en la biblioteca.</p>}
        </div>}
        <button type="button" className="hn-canvas-remove" disabled={busy}
          onClick={()=>onChoose('')}>Quitar archivo</button>
      </>}
      {busy&&<p className="hn-canvas-message" role="status">Subiendo fotografía...</p>}
      {error&&<p className="hn-canvas-error" role="alert">{error}</p>}
    </div>
  </div>;
}
