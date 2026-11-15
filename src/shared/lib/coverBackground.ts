/** Use only the photo selected by Fer & Noa; never inject a stock fallback. */
export function coverBackground(cover: string, overlay: string): string {
  return cover ? overlay + ', url("' + cover.replace(/"/g, '%22') + '")' : overlay;
}
