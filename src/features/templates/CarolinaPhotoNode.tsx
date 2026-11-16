import { useRef } from 'react';
import type { CarolinaTransform } from './carolina-layout';
import { useCarolinaGesture } from './useCarolinaGesture';
import type { CarolinaGestureInteraction } from './useCarolinaGesture';

type Props = {
  id: string;
  url: string;
  transform?: CarolinaTransform;
  interaction?: CarolinaGestureInteraction;
  onSelect?: () => void;
  cover?: boolean;
  position?: number;
  extra?: boolean;
};

/** One editable photo region shared by the real Carolina editor and the client reader. */
export default function CarolinaPhotoNode({
  id, url, transform, interaction, onSelect, cover = false, position, extra = false,
}: Props) {
  const element = useRef<HTMLButtonElement>(null);
  const gesture = useCarolinaGesture(id, element, transform, interaction);
  const className = (extra ? 'hn-carolina-floating-photo' : cover ? 'hn-carolina-cover-photo' : 'hn-carolina-photo hn-carolina-photo-' + position) +
    (onSelect ? ' hn-carolina-editable-photo' : '') +
    (gesture.selected ? ' hn-photo-transforming' : '');
  const image = url ? 'url("' + url + '")' : undefined;
  const style = { backgroundImage: cover && url
    ? 'linear-gradient(180deg,rgba(20,15,13,.33),rgba(20,15,13,.09) 55%,rgba(20,15,13,.42)),' + image
    : image, transform: gesture.transform };
  if (onSelect) return (
    <button type="button" ref={element} className={className} style={style}
      aria-label={extra ? 'Elegir fotografía añadida' : cover ? 'Elegir fotografía de portada' : 'Elegir fotografía del recuadro ' + position}
      onPointerDown={gesture.onPointerDown} onPointerMove={gesture.onPointerMove}
      onPointerUp={gesture.onPointerUp} onPointerCancel={gesture.onPointerUp}
      onContextMenu={event => event.preventDefault()}
      onClick={() => { if (!gesture.suppressTap()) onSelect(); }}>
      {!url && <span className="hn-carolina-empty-photo">+</span>}
      {!cover && !extra && <span className="hn-carolina-photo-index">{String(position).padStart(2, '0')}</span>}
      {cover && !url && <span className="hn-carolina-cover-invite">Añadir fotografía</span>}
    </button>
  );
  return <div className={className} role="img"
    aria-label={extra ? 'Fotografía adicional' : cover ? 'Fotografía de portada' : url ? 'Wedding photograph ' + position : 'Photograph slot ' + position}
    style={style}/>;
}
