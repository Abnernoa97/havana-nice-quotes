import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import TemplateCanvasEditor from './canvas/TemplateCanvasEditor';
import type { PhotoTarget, EditQuoteField } from './shared/editor-types';

type Props = {
  item: Quote;
  edit: EditQuoteField;
  cloudPhotos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<string>;
};

/** Render the chosen template itself, without duplicate toolbars and image grids. */
export default function QuoteDesignPanel({ item, edit, cloudPhotos, onUploadPhoto }: Props) {
  return <TemplateCanvasEditor item={item} edit={edit}
    photos={cloudPhotos} onUploadPhoto={onUploadPhoto}/>;
}
