import './cover-add-prompt.css';

type Props={onAdd?:()=>void;occupied?:boolean};

/** The visible plus and label are one real accessible action, above decorative overlays.
 * Reused by Carolina and all editorial skins. Reader/3D never display edit controls. */
export default function CoverAddPrompt({onAdd,occupied=false}:Props){
  if(!onAdd)return null;
  return <button type="button" className={'hn-template-cover-add'+(occupied?' is-occupied':'')}
    aria-label={occupied?'Cambiar archivo de portada':'Añadir archivo de portada'}
    onPointerDown={event=>event.stopPropagation()}
    onClick={event=>{event.stopPropagation();onAdd();}}>
    <span className="hn-template-cover-plus" aria-hidden="true">+</span>
    <span>{occupied?'Cambiar archivo':'Añadir archivo'}</span>
  </button>;
}
