/** Physical cover dimensions anchored to the PageFlip block, not the viewport. */
export function computeMagazineBindingGeometry(
  page: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  stage: Pick<DOMRect, 'left' | 'top'>,
  paperDepth: number,
) {
  // A flat cover board projects OUTSIDE the sheet; the shallow joint touches
  // the first pixels of the sheet. Avoid a cylindrical strip over the page.
  const width = Math.round(Math.min(54, Math.max(38, page.width * 0.115)));
  const exterior = Math.round(width * 0.58);
  return {
    left: page.left - stage.left - exterior,
    top: page.top - stage.top - 2,
    width,
    height: page.height + Math.max(0, paperDepth) + 4,
    exterior,
  };
}
