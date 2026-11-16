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

export type CarolinaTransform = { x: number; y: number; scale: number; rotation: number };
export type CarolinaExtra = { id: string; page: 0 | 1 | 2; text: string };
export type CarolinaLayout = {
  fixed?: Partial<Record<CarolinaFixedKey, string>>;
  transforms?: Record<string, CarolinaTransform>;
  extras?: CarolinaExtra[];
  photoOrder?: number[];
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
  if (Object.keys(layout).some(k => !['fixed', 'transforms', 'extras', 'photoOrder'].includes(k))) return false;
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
      if (!/^(fixed:[a-zA-Z]+|field:[a-z]+|extra:[a-f0-9-]{36}|photo:(?:cover|[0-5]))$/.test(id) ||
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
export function movePhotoSlot(order: readonly number[], slot: number, direction: -1 | 1): number[] {
  const index = order.indexOf(slot);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= order.length) return [...order];
  const changed = [...order];
  [changed[index], changed[next]] = [changed[next], changed[index]];
  return changed;
}
export function photoSlotToAdd(order: readonly number[], gallery: readonly string[]): number | null {
  const remaining = Array.from({ length: CAROLINA_MAX_SLOTS }, (_, i) => i)
    .filter(index => !order.includes(index));
  return remaining.find(index => !gallery[index]) ?? remaining[0] ?? null;
}
export function emptyPhotoSlotToDuplicate(order: readonly number[], gallery: readonly string[]): number | null {
  return Array.from({ length: CAROLINA_MAX_SLOTS }, (_, i) => i)
    .find(index => !order.includes(index) && !gallery[index]) ?? null;
}
