/** Definición local mínima de la API utilizada de page-flip 2.0.7.
 * No modifica el motor ni sus parámetros de animación.
 */
declare module 'page-flip' {
  type TurnCorner = 'top' | 'bottom';
  type FlipEvent = { data: number | string };
  type FlipSettings = {
    width: number;
    height: number;
    size: 'stretch' | 'fixed';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    usePortrait?: boolean;
    autoSize?: boolean;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  };
  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(elements: HTMLElement[] | NodeListOf<HTMLElement>): void;
    on(event: 'flip' | 'changeOrientation', listener: (event: FlipEvent) => void): void;
    flipNext(corner?: TurnCorner): void;
    flipPrev(corner?: TurnCorner): void;
    destroy(): void;
  }
}
