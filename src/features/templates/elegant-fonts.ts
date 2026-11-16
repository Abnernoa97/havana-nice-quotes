/** Curated, on-demand Google Fonts. No fonts are loaded until previews or selected text need them. */
export const ELEGANT_FONT_GROUPS = [
  {id:'editorial',label:'Editoriales'}, {id:'clasica',label:'Clásicas'},
  {id:'firma',label:'Caligráficas'}, {id:'moderna',label:'Modernas'},
] as const;
export type ElegantFontGroup = typeof ELEGANT_FONT_GROUPS[number]['id'];
export const ELEGANT_FONTS = [
  {
    "id": "cinzel",
    "name": "Cinzel",
    "group": "editorial"
  },
  {
    "id": "cinzel-decorative",
    "name": "Cinzel Decorative",
    "group": "editorial"
  },
  {
    "id": "bodoni-moda",
    "name": "Bodoni Moda",
    "group": "editorial"
  },
  {
    "id": "playfair-display",
    "name": "Playfair Display",
    "group": "editorial"
  },
  {
    "id": "cormorant-garamond",
    "name": "Cormorant Garamond",
    "group": "editorial"
  },
  {
    "id": "dm-serif-display",
    "name": "DM Serif Display",
    "group": "editorial"
  },
  {
    "id": "prata",
    "name": "Prata",
    "group": "editorial"
  },
  {
    "id": "italiana",
    "name": "Italiana",
    "group": "editorial"
  },
  {
    "id": "gilda-display",
    "name": "Gilda Display",
    "group": "editorial"
  },
  {
    "id": "marcellus",
    "name": "Marcellus",
    "group": "editorial"
  },
  {
    "id": "libre-bodoni",
    "name": "Libre Bodoni",
    "group": "editorial"
  },
  {
    "id": "abril-fatface",
    "name": "Abril Fatface",
    "group": "editorial"
  },
  {
    "id": "yeseva-one",
    "name": "Yeseva One",
    "group": "editorial"
  },
  {
    "id": "eb-garamond",
    "name": "EB Garamond",
    "group": "clasica"
  },
  {
    "id": "libre-baskerville",
    "name": "Libre Baskerville",
    "group": "clasica"
  },
  {
    "id": "lora",
    "name": "Lora",
    "group": "clasica"
  },
  {
    "id": "forum",
    "name": "Forum",
    "group": "clasica"
  },
  {
    "id": "cardo",
    "name": "Cardo",
    "group": "clasica"
  },
  {
    "id": "oranienbaum",
    "name": "Oranienbaum",
    "group": "clasica"
  },
  {
    "id": "della-respira",
    "name": "Della Respira",
    "group": "clasica"
  },
  {
    "id": "cormorant-infant",
    "name": "Cormorant Infant",
    "group": "clasica"
  },
  {
    "id": "crimson-pro",
    "name": "Crimson Pro",
    "group": "clasica"
  },
  {
    "id": "newsreader",
    "name": "Newsreader",
    "group": "clasica"
  },
  {
    "id": "inria-serif",
    "name": "Inria Serif",
    "group": "clasica"
  },
  {
    "id": "great-vibes",
    "name": "Great Vibes",
    "group": "firma"
  },
  {
    "id": "allura",
    "name": "Allura",
    "group": "firma"
  },
  {
    "id": "alex-brush",
    "name": "Alex Brush",
    "group": "firma"
  },
  {
    "id": "parisienne",
    "name": "Parisienne",
    "group": "firma"
  },
  {
    "id": "pinyon-script",
    "name": "Pinyon Script",
    "group": "firma"
  },
  {
    "id": "sacramento",
    "name": "Sacramento",
    "group": "firma"
  },
  {
    "id": "tangerine",
    "name": "Tangerine",
    "group": "firma"
  },
  {
    "id": "petit-formal-script",
    "name": "Petit Formal Script",
    "group": "firma"
  },
  {
    "id": "italianno",
    "name": "Italianno",
    "group": "firma"
  },
  {
    "id": "tenor-sans",
    "name": "Tenor Sans",
    "group": "moderna"
  },
  {
    "id": "jost",
    "name": "Jost",
    "group": "moderna"
  },
  {
    "id": "raleway",
    "name": "Raleway",
    "group": "moderna"
  },
  {
    "id": "montserrat",
    "name": "Montserrat",
    "group": "moderna"
  },
  {
    "id": "manrope",
    "name": "Manrope",
    "group": "moderna"
  },
  {
    "id": "josefin-sans",
    "name": "Josefin Sans",
    "group": "moderna"
  },
  {
    "id": "questrial",
    "name": "Questrial",
    "group": "moderna"
  },
  {
    "id": "urbanist",
    "name": "Urbanist",
    "group": "moderna"
  },
  {
    "id": "dm-sans",
    "name": "DM Sans",
    "group": "moderna"
  }
] as const satisfies readonly {id:string;name:string;group:ElegantFontGroup}[];
export type ElegantFontId = typeof ELEGANT_FONTS[number]['id'];
const ids: ReadonlySet<string> = new Set(ELEGANT_FONTS.map(font=>font.id));
export function isElegantFontId(value: unknown): value is ElegantFontId {
  return typeof value === 'string' && ids.has(value);
}
export function elegantFontFamily(id: ElegantFontId): string {
  const font=ELEGANT_FONTS.find(item=>item.id===id);
  if (!font) return 'inherit';
  const fallback=font.group==='firma'?'cursive':font.group==='moderna'?'sans-serif':'serif';
  return '"' + font.name + '", ' + fallback;
}
/** Let browser cache a stylesheet per known family. Zero new Worker/R2/D1 resources. */
export function loadElegantFont(id: ElegantFontId): void {
  if (typeof document === 'undefined') return;
  const font=ELEGANT_FONTS.find(item=>item.id===id);
  if (!font || document.head.querySelector('link[data-hn-font="' + id + '"]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.dataset.hnFont=id;
  link.href='https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(font.name).replace(/%20/g,'+') + '&display=swap';
  document.head.appendChild(link);
}
