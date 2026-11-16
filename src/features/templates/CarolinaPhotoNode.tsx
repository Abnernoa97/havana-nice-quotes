import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { CarolinaPhotoStyle, CarolinaTransform } from './carolina-layout';
import { CAROLINA_PHOTO_DEFAULTS as D } from './carolina-layout';
import { CROP_ASPECT_RATIOS } from './photo-crop';
import { useCarolinaGesture } from './useCarolinaGesture';
import type { CarolinaGestureInteraction } from './useCarolinaGesture';

type Props = {
  id: string; url: string; transform?: CarolinaTransform;
  photoStyle?: CarolinaPhotoStyle;
  interaction?: CarolinaGestureInteraction;
  onSelect?: () => void;
  cover?: boolean; position?: number; extra?: boolean;
};

function vignette(style: CarolinaPhotoStyle | undefined): CSSProperties | undefined {
  if (!style?.vignetteShape || style.vignetteShape === 'none') return undefined;
  const strength = (style.vignetteStrength ?? D.vignetteStrength) / 100;
  const color = style.vignetteColor === 'white' ? '255,255,255' : '0,0,0';
  const ink = 'rgba(' + color + ',' + strength + ')';
  const x = style.vignetteX ?? D.vignetteX, y = style.vignetteY ?? D.vignetteY;
  const size = style.vignetteSize ?? D.vignetteSize;
  const radius = Math.round(12 + size * .63);
  if (style.vignetteShape === 'round') {
    return { background: 'radial-gradient(ellipse at ' + x + '% ' + y +
      '%,transparent 0%,transparent ' + radius + '%,' + ink + ' 100%)' };
  }
  const edgeX = Math.max(2, Math.round(size * .42));
  const edgeY = Math.max(2, Math.round(size * .42));
  const left = Math.max(0,x-edgeX), right = Math.min(100,x+edgeX);
  const top = Math.max(0,y-edgeY), bottom = Math.min(100,y+edgeY);
  return { background:
    'linear-gradient(90deg,' + ink + ',transparent ' + left + '%,transparent ' + right + '%,' + ink + '),' +
    'linear-gradient(0deg,' + ink + ',transparent ' + top + '%,transparent ' + bottom + '%,' + ink + ')' };
}

/** The image is a clipped visual layer; transforms move its frame, crop controls move its content.
 * This single rendering is shared by the designer, Scroll and the 3D book. */
export default function CarolinaPhotoNode({
  id, url, transform, photoStyle, interaction, onSelect, cover = false, position, extra = false,
}: Props) {
  const element = useRef<HTMLButtonElement>(null);
  const gesture = useCarolinaGesture(id, element, transform, interaction);
  const className = (extra ? 'hn-carolina-floating-photo' : cover ? 'hn-carolina-cover-photo' : 'hn-carolina-photo hn-carolina-photo-' + position) +
    (onSelect ? ' hn-carolina-editable-photo' : '') +
    (gesture.selected ? ' hn-photo-transforming' : '');
  const mainStyle: CSSProperties = {
    transform: gesture.transform,
    ...(extra ? {zIndex: photoStyle?.behindText ? 1 : 4} : {}),
  };
  const ratio = photoStyle?.cropAspect || 'frame';
  const ratioStyle = ratio !== 'frame' ? {'--crop-ratio': String(CROP_ASPECT_RATIOS[ratio])} as CSSProperties : undefined;
  const picture: CSSProperties = {
    backgroundImage: url ? 'url("' + url + '")' : undefined,
    backgroundPosition: (photoStyle?.cropX ?? D.cropX) + '% ' + (photoStyle?.cropY ?? D.cropY) + '%',
    transform: 'rotate(' + (photoStyle?.cropRotation ?? D.cropRotation) + 'deg) scale(' + ((photoStyle?.cropZoom ?? D.cropZoom) / 100) + ')',
    transformOrigin: (photoStyle?.cropX ?? D.cropX) + '% ' + (photoStyle?.cropY ?? D.cropY) + '%',
    filter: 'brightness(' + (photoStyle?.brightness ?? D.brightness) + '%) ' +
      'contrast(' + (photoStyle?.contrast ?? D.contrast) + '%) ' +
      'saturate(' + (photoStyle?.saturate ?? D.saturate) + '%) ' +
      'hue-rotate(' + (photoStyle?.hue ?? D.hue) + 'deg) ' +
      'grayscale(' + (photoStyle?.grayscale ?? D.grayscale) + '%) ' +
      'sepia(' + (photoStyle?.sepia ?? D.sepia) + '%)',
    opacity: (photoStyle?.opacity ?? D.opacity) / 100,
  };
  const tintOpacity = (photoStyle?.tintAmount ?? D.tintAmount) / 100;
  const content = <>
    <span className={'hn-carolina-crop-viewport'+(ratio!=='frame'?' is-ratio':'')} style={ratioStyle} aria-hidden="true">
      {url && <span className="hn-carolina-image-fill" style={picture}/>}
      {url && tintOpacity>0 && <span className="hn-carolina-image-tint"
        style={{background:photoStyle?.tint || '#244a37',opacity:tintOpacity}}/>}
      {cover && url && <span className="hn-carolina-photo-shade"/>}
      {url && photoStyle?.vignetteShape && photoStyle.vignetteShape!=='none' &&
        <span className="hn-carolina-image-vignette" style={vignette(photoStyle)}/>}
    </span>
    {!url && onSelect && !cover && <span className="hn-carolina-empty-photo">+</span>}
    {!cover && !extra && onSelect && <span className="hn-carolina-photo-index">{String(position).padStart(2,'0')}</span>}
  </>;
  if (onSelect) return (
    <button type="button" ref={element} data-hn-photo-id={id} className={className} style={mainStyle}
      aria-label={extra ? 'Editar fotografía añadida' : cover ? 'Editar fotografía de portada' : 'Editar fotografía del recuadro ' + position}
      onPointerDown={gesture.onPointerDown} onPointerMove={gesture.onPointerMove}
      onPointerUp={gesture.onPointerUp} onPointerCancel={gesture.onPointerCancel}
      onContextMenu={event => event.preventDefault()}
      onClick={() => { if (!gesture.suppressTap()) onSelect(); }}>
      {content}
    </button>
  );
  return <div className={className} role="img" style={mainStyle}
    aria-label={extra ? 'Fotografía adicional' : cover ? 'Fotografía de portada' : 'Fotografía ' + position}>
    {content}
  </div>;
}
