import type { Quote } from '../quotes/types';
import type { CloudPhoto } from '../photos/useMediaLibrary';
import TemplateCanvasEditor from './canvas/TemplateCanvasEditor';
import type { PhotoTarget } from './shared/editor-types';

type Props = {
  item: Quote;
  edit: (key: keyof Quote, value: Quote[keyof Quote]) => void;
  cloudPhotos: CloudPhoto[];
  onUploadPhoto: (file: File, target: PhotoTarget) => Promise<void>;
};

/** Render the chosen template itself, without duplicate toolbars and image grids. */
export default function QuoteDesignPanel({ item, edit, cloudPhotos, onUploadPhoto }: Props) {
  return <TemplateCanvasEditor item={item} edit={edit}
    photos={cloudPhotos} onUploadPhoto={onUploadPhoto}/>;
}
