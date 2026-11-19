import type { CarolinaLayout, CarolinaPageId } from './carolina-layout.ts';
import { isBlankPage } from './carolina-layout.ts';

/** The first confirmed photo or video is the page background in custom pages.
 * It is derived from the shared layout, without a second schema or migration.
 * Original cover/collage/terms keep their authored compositions intact. */
export function pageBackgroundMediaId(layout: CarolinaLayout | undefined, page: CarolinaPageId): string | undefined {
  if (!isBlankPage(page) && !layout?.freeCanvas) return undefined;
  return layout?.extraPhotos?.find(media => media.page === page && !!media.url)?.id;
}
