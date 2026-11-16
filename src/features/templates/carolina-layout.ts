import { isElegantFontId } from './elegant-fonts.ts';
import type { ElegantFontId } from './elegant-fonts.ts';

/** Device-independent geometry and per-quotation text customization. */
export const CAROLINA_FIXED = {
  brand: 'HAVANA NICE',
  subtitle: 'Live Wedding Music',
  celebration: 'The Celebration',
  experience: 'The Experience',
  production: 'Production & Tech',
  date: 'Date: ',
  venue: 'The setting: ',
  service: 'Service: ',
  performance: 'Performance: ',
  musicians: 'On Stage: ',
  crew: 'Our Crew: ',
  backline: 'Includes full backline: ',
  investment: 'Investment: ',
  depositBefore: 'To secure your date, we require a ',
  depositAfter: ' deposit and a signed agreement. ',
  av: '• AV Production: ',
  bullet: '• ',
  space: '• Space: ',
} as const;
export type CarolinaFixedKey = keyof typeof CAROLINA_FIXED;
export const CAROLINA_DEFAULT_SLOTS = 6;
export const CAROLINA_MAX_SLOTS = 12;
export const CAROLINA_DEFAULT_ORDER = Array.from({ length: CAROLINA_DEFAULT_SLOTS }, (_, i) => i);
export const CAROLINA_PAGE_TITLES = ['Portada', 'Collage', 'Propuesta'] as const;
export type CarolinaPageId = 0 | 1 | 2;
export const CAROLINA_DEFAULT_PAGES: CarolinaPageId[] = [0,1,2];
export function carolinaPageOrder(layout: CarolinaLayout | undefined): CarolinaPageId[] {
  return [...(layout?.pageOrder || CAROLINA_DEFAULT_PAGES)];
}

export type CarolinaTransform = { x: number; y: number; scale: number; rotation: number };
/** Appearance is scoped to an individual text block; never inherited by its siblings. */
export type CarolinaTextStyle = { color?: string; size?: number; stretchX?: number; stretchY?: number };
/** Image effects are tied to a stable frame ID, never to the R2 asset URL.
 * Replacing a photo therefore preserves its entire treatment. */
export type CarolinaPhotoStyle = {
  behindText?: boolean;
  brightness?: number; contrast?: number; saturate?: number;
  hue?: number; grayscale?: number; sepia?: number;
  tint?: string; tintAmount?: number;
  cropZoom?: number; cropX?: number; cropY?: number;
  cropAspect?: 'frame'|'1:1'|'4:5'|'9:16'|'16:9';
  cropRotation?: number;
  opacity?: number;
  vignetteShape?: 'none' | 'square' | 'round';
  vignetteColor?: 'black' | 'white';
  vignetteStrength?: number; vignetteSize?: number;
  vignetteX?: number; vignetteY?: number;
};
export const CAROLINA_PHOTO_DEFAULTS = {
  brightness: 100, contrast: 100, saturate: 100, hue: 0,
  grayscale: 0, sepia: 0, tintAmount: 0,
  cropZoom: 100, cropX: 50, cropY: 50, cropRotation: 0, opacity: 100,
  vignetteStrength: 45, vignetteSize: 55, vignetteX: 50, vignetteY: 50,
} as const;

export type CarolinaExtra = { id: string; page: CarolinaPageId; text: string };
export type CarolinaExtraPhoto = { id: string; page: CarolinaPageId; url: string };
export type CarolinaLayout = {
  fixed?: Partial<Record<CarolinaFixedKey, string>>;
  transforms?: Record<string, CarolinaTransform>;
  extras?: CarolinaExtra[];
  photoOrder?: number[];
  pageOrder?: CarolinaPageId[];
  extraPhotos?: CarolinaExtraPhoto[];
  defaultFont?: ElegantFontId;
  fonts?: Record<string, ElegantFontId>;
  textStyles?: Record<string, CarolinaTextStyle>;
  photoStyles?: Record<string, CarolinaPhotoStyle>;
};
export const ZERO_TRANSFORM: CarolinaTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

export function fixedText(layout: CarolinaLayout | undefined, key: CarolinaFixedKey): string {
  return layout?.fixed && Object.prototype.hasOwnProperty.call(layout.fixed, key)
    ? layout.fixed[key]! : CAROLINA_FIXED[key];
}
export function clampTransform(value: CarolinaTransform): CarolinaTransform {
  const n = (raw: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(raw * 100) / 100));
  return {
    x: n(value.x, -180, 180), y: n(value.y, -180, 180),
    scale: n(value.scale, .35, 4), rotation: n(value.rotation, -180, 180),
  };
}

/** Shared by editor and private D1 API: invalid layouts are rejected. */
export function validCarolinaLayout(value: unknown): value is CarolinaLayout {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const layout = value as Record<string, unknown>;
  if (Object.keys(layout).some(k => !['fixed', 'transforms', 'extras', 'photoOrder', 'pageOrder', 'extraPhotos', 'defaultFont', 'fonts', 'textStyles', 'photoStyles'].includes(k))) return false;
  if (layout.defaultFont !== undefined && !isElegantFontId(layout.defaultFont)) return false;
  if (layout.fonts !== undefined) {
    if (!layout.fonts || typeof layout.fonts !== 'object' || Array.isArray(layout.fonts)) return false;
    const entries=Object.entries(layout.fonts);
    if (entries.length > 100 || entries.some(([id,font]) =>
      !/^(fixed:[a-zA-Z]+|field:[a-z]+(?::cover)?|extra:[a-f0-9-]{36})$/.test(id) ||
      !isElegantFontId(font))) return false;
  }
  if (layout.textStyles !== undefined) {
    if (!layout.textStyles || typeof layout.textStyles !== 'object' || Array.isArray(layout.textStyles)) return false;
    const entries=Object.entries(layout.textStyles);
    if (entries.length>100 || entries.some(([id,raw])=>{
      if (!/^(fixed:[a-zA-Z]+|field:[a-z]+(?::cover)?|extra:[a-f0-9-]{36})$/.test(id) ||
        !raw || typeof raw!=='object' || Array.isArray(raw)) return true;
      const style=raw as Record<string,unknown>;
      const validPct=(key:string,min:number,max:number)=>
        style[key]===undefined || typeof style[key]==='number' &&
        Number.isInteger(style[key]) && style[key]>=min && style[key]<=max;
      return Object.keys(style).some(key=>!['color','size','stretchX','stretchY'].includes(key)) ||
        style.color!==undefined && (typeof style.color!=='string' ||
          !/^#[0-9a-fA-F]{6}$/.test(style.color)) ||
        !validPct('size',50,300) || !validPct('stretchX',50,200) || !validPct('stretchY',50,200);
    })) return false;
  }
  if (layout.photoStyles !== undefined) {
    if (!layout.photoStyles || typeof layout.photoStyles !== 'object' || Array.isArray(layout.photoStyles)) return false;
    const entries = Object.entries(layout.photoStyles);
    if (entries.length > 40) return false;
    const numeric: Record<string,[number,number]> = {
      brightness:[0,200], contrast:[0,200], saturate:[0,200],
      hue:[-180,180], grayscale:[0,100], sepia:[0,100],
      tintAmount:[0,100], cropZoom:[100,300], cropX:[0,100], cropRotation:[-180,180],
      cropY:[0,100], opacity:[0,100], vignetteStrength:[0,100],
      vignetteSize:[0,100], vignetteX:[0,100], vignetteY:[0,100],
    };
    for (const [id,raw] of entries) {
      if (!/^(photo:(?:cover|1[01]|[0-9])|photo-extra:[a-f0-9-]{36})$/.test(id) ||
        !raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      const style = raw as Record<string,unknown>;
      for (const [key,val] of Object.entries(style)) {
        if (key === 'behindText') { if (typeof val !== 'boolean') return false; }
        else if (key === 'tint') {
          if (typeof val !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(val)) return false;
        } else if (key === 'cropAspect') {
          if (!['frame','1:1','4:5','9:16','16:9'].includes(val as string)) return false;
        } else if (key === 'vignetteShape') {
          if (val !== 'none' && val !== 'square' && val !== 'round') return false;
        } else if (key === 'vignetteColor') {
          if (val !== 'black' && val !== 'white') return false;
        } else {
          const range = numeric[key];
          if (!range || typeof val !== 'number' || !Number.isInteger(val) ||
            val < range[0] || val > range[1]) return false;
        }
      }
    }
  }
  if (layout.pageOrder !== undefined) {
    if (!Array.isArray(layout.pageOrder) || !layout.pageOrder.length || layout.pageOrder.length>3 ||
      new Set(layout.pageOrder).size!==layout.pageOrder.length ||
      layout.pageOrder.some((page:unknown)=>page!==0&&page!==1&&page!==2)) return false;
  }
  if (layout.extraPhotos !== undefined) {
    if (!Array.isArray(layout.extraPhotos) || layout.extraPhotos.length>24) return false;
    const seen=new Set<string>();
    for (const photo of layout.extraPhotos) {
      if (!photo || typeof photo!=='object' || Array.isArray(photo)) return false;
      const p=photo as Record<string,unknown>;
      if (Object.keys(p).sort().join(',')!=='id,page,url' ||
        typeof p.id!=='string' || !/^[a-f0-9-]{36}$/.test(p.id) ||
        seen.has(p.id) || (p.page!==0&&p.page!==1&&p.page!==2) ||
        typeof p.url!=='string' || p.url!=='' &&
        !/^\/api\/media\/[a-f0-9-]{36}$/.test(p.url)) return false;
      seen.add(p.id);
    }
  }
  if (layout.photoOrder !== undefined) {
    if (!Array.isArray(layout.photoOrder) || layout.photoOrder.length < 1 ||
      layout.photoOrder.length > CAROLINA_MAX_SLOTS ||
      new Set(layout.photoOrder).size !== layout.photoOrder.length ||
      layout.photoOrder.some((index: unknown) => !Number.isInteger(index) ||
        (index as number) < 0 || (index as number) >= CAROLINA_MAX_SLOTS)) return false;
  }
  if (layout.fixed !== undefined) {
    if (!layout.fixed || typeof layout.fixed !== 'object' || Array.isArray(layout.fixed)) return false;
    const entries = Object.entries(layout.fixed);
    if (entries.length > Object.keys(CAROLINA_FIXED).length ||
      entries.some(([k, v]) => !Object.prototype.hasOwnProperty.call(CAROLINA_FIXED, k) || typeof v !== 'string' || v.length > 1200)) return false;
  }
  if (layout.transforms !== undefined) {
    if (!layout.transforms || typeof layout.transforms !== 'object' || Array.isArray(layout.transforms)) return false;
    if (Object.entries(layout.transforms).length > 100) return false;
    for (const [id, raw] of Object.entries(layout.transforms)) {
      if (!/^(fixed:[a-zA-Z]+|field:[a-z]+(?::cover)?|extra:[a-f0-9-]{36}|photo:(?:cover|1[01]|[0-9])|photo-extra:[a-f0-9-]{36})$/.test(id) ||
        !raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      const t = raw as Record<string, unknown>;
      if (Object.keys(t).sort().join(',') !== 'rotation,scale,x,y') return false;
      const within = (k: string, min: number, max: number) =>
        typeof t[k] === 'number' && Number.isFinite(t[k]) && t[k] >= min && t[k] <= max;
      if (!within('x', -180, 180) || !within('y', -180, 180) ||
        !within('scale', .35, 4) || !within('rotation', -180, 180)) return false;
    }
  }
  if (layout.extras !== undefined) {
    if (!Array.isArray(layout.extras) || layout.extras.length > 25) return false;
    const ids = new Set<string>();
    for (const raw of layout.extras) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      const e = raw as Record<string, unknown>;
      if (Object.keys(e).sort().join(',') !== 'id,page,text' ||
        typeof e.id !== 'string' || !/^[a-f0-9-]{36}$/.test(e.id) || ids.has(e.id) ||
        ![0, 1, 2].includes(e.page as number) || typeof e.text !== 'string' ||
        e.text.length > 3000) return false;
      ids.add(e.id);
    }
  }
  return true;
}


/** IDs are stable gallery slots; order changes never move original R2 objects or lose hidden photos. */
export function carolinaPhotoOrder(layout: CarolinaLayout | undefined): number[] {
  return [...(layout?.photoOrder || CAROLINA_DEFAULT_ORDER)];
}
export function photoSlotToAdd(order: readonly number[], gallery: readonly string[]): number | null {
  const remaining = Array.from({ length: CAROLINA_MAX_SLOTS }, (_, i) => i)
    .filter(index => !order.includes(index));
  return remaining.find(index => !gallery[index]) ?? remaining[0] ?? null;
}
