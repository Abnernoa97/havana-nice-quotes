# Paquete de limpieza CSS 01 · HAVANA NICE QUOTES

**Objetivo:** 12 simplificaciones de CSS en cuatro archivos, publicadas juntas después de verificar el build completo. No modifica JSX, API, D1, R2, los archivos de clientes ni PageFlip 3D.

## Doce mejoras

1. Eliminar el padding antiguo de `hn-styles-tab` anulado por su versión definitiva.
2. Reunir altura y centrado del texto de las tarjetas en `hn-card-caption`.
3. Centralizar el tamaño final de `hn-card-caption strong`.
4. Reunir `transform-origin` en la regla original de fotos Carolina.
5. Consolidar los tres bloques globales de `hn-carolina-extra-layer` con índice final 16.
6. Reunir las dos declaraciones de capas en páginas en blanco.
7. Unificar colores, padding y gap de términos del estilo Lane.
8. Unificar colores y padding de términos del estilo Junebug.
9. Quitar `touch-action:none` repetido en el estado `editing-effect`, heredado del marco.
10. Quitar `overscroll-behavior-y:contain` repetido por la abreviatura `overscroll-behavior:contain`.
11. Quitar `flex-shrink:0` repetido por `flex:0 0 auto`.
12. Retirar `grid-template-columns:none` sin efecto en una fila `display:flex`.

**Regresión:** `tests/css-package-editor-01.test.mjs` protege estilo, profundidad de capas, scroll, gestos y reglas móviles. Mantener los estilos responsivos y los efectos aprobados. Cualquier error posterior se investiga primero contra el commit de este paquete.

**Publicación:** al terminar el build de Cloudflare, comprobar el SHA de `main`, las pruebas y el deployment al 100 %. No afirmar aprobado físico hasta verificar en Android y iPhone.
