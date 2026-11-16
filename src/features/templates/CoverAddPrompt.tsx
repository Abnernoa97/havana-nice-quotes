import './cover-add-prompt.css';

type Props={onAdd?:()=>void};

/** The visible plus and label are one real accessible action, above decorative overlays.
 * Reused by Carolina and all editorial skins. Reader/3D never display edit controls. */
export default function CoverAddPrompt({onAdd}:Props){
  if(!onAdd)return null;
  return <button type="button" className="hn-template-cover-add"
    aria-label="Añadir fotografía de portada"
    onPointerDown={event=>event.stopPropagation()}
    onClick={event=>{event.stopPropagation();onAdd();}}>
    <span className="hn-template-cover-plus" aria-hidden="true">+</span>
    <span>Añadir fotografía</span>
  </button>;
}
