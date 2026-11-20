# 19 · Fondo blanco / beige por hoja — HAVANA NICE Quotes

Fondo individual por página, conservado en el único `Quote.designLayout.pagePapers`.

- En Diseñador, junto a la navegación, aparece **Fondo**. Se elige **Blanco** (#ffffff) o **Beige** (#f1ebdf) para la hoja activa.
- **Aplicar a todas las hojas** es una acción explícita y opcional; no se fuerza el mismo color en toda la revista.
- Las cotizaciones existentes no cambian de aspecto mientras no se seleccione un color; las editoriales conservan su diseño original.
- Guardar conserva la elección; el mismo componente renderiza en Diseño, Scroll, enlace de cliente y Revista 3D. La cara de papel de 3D también adopta el tono.
- Duplicar copia el tono; eliminar una página elimina la entrada; reordenar conserva el tono por ID.
- La validación compartida por el Worker D1 limita los colores a dos y rechaza referencias de páginas inexistentes; no hace falta migración SQL ni tocar R2.
- `tests/page-paper-tone.test.mjs` controla modelo, páginas, contrato de render y persistencia. QA visual en Android/iPhone queda por comprobar.
