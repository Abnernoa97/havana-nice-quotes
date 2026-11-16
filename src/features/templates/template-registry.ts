/** One registry for existing and future editorial templates. */
export const TEMPLATE_REGISTRY={
 carolina:{name:'HAVANA NICE Original · Carolina',family:'carolina'},
 libre:{name:'Estilo libre',family:'editorial'},
 vogue:{name:'Vogue',family:'editorial'},
 lane:{name:'The Lane',family:'editorial'},
 junebug:{name:'Junebug Weddings',family:'editorial'},
 nyt:{name:'The New York Times',family:'editorial'},
} as const;
export type TemplateStyle=keyof typeof TEMPLATE_REGISTRY;
export const TEMPLATE_IDS=Object.keys(TEMPLATE_REGISTRY) as TemplateStyle[];
export function isTemplateStyle(value:unknown):value is TemplateStyle{
 return typeof value==='string'&&Object.prototype.hasOwnProperty.call(TEMPLATE_REGISTRY,value);
}
export function templateFamily(value:unknown):'carolina'|'editorial'{
 return value==='carolina'||!isTemplateStyle(value)?'carolina':'editorial';
}
