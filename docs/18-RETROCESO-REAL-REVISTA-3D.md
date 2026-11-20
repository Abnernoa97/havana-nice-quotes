# 18 · Retroceso de revista 3D: hoja que se despega, no rectángulo que entra

El motor original `page-flip@2.0.7` anima la hoja anterior hacia dentro en modo vertical, lo que produce una tarjeta/cuadrado grande en lugar de un retroceso curvo. La corrección está en `@gullabs/flipbook-core@3.2.2` (mismo linaje StPageFlip, versión derivada mantenida), ver `https://github.com/gul-labs/flipbook` y `MIGRATION.md`.

## Alcance

- Solo `FlipMagazine.tsx` importa el motor corregido; el diseño editorial, Canvas, Scroll y PageFlip de HAVANA NICE V2 permanecen intactos.
- Migración explícita de opciones: `size`→`sizing`, `showCover`→`hardCovers`, `mobileScrollSupport`→`allowTouchScroll`, `showPageCorners`→`foldCornerOnHover`, `disableFlipByClick`→`flipOnClick`.
- Los eventos utilizan ahora `e.data.page`, `e.data.orientation` y `e.data.state`.
- Retroceso mediante `flip.flipPrev('bottom')`, la API corregida que despega la hoja actual y descubre la anterior por debajo. Ya no se accede a `getFlipController` ni `getPageCollection` internos.
- `useMagazinePaperGesture` conserva `startUserTouch / userMove / userStop`, con coordenadas del propio `getBlockElement()`.
- El motor ignora eventos táctiles internos (`pointerInput:['mouse']`) para no duplicar gestos; la capa React controla el toque en Android/iPhone y el mouse sigue funcionando en PC.
- Se conserva `flippingTime:650`, sombra 0.72 y la estética de papel satinado.
- Atribución y fuente accesibles en `public/third-party-notices.txt`. Licencia MPL-2.0 del motor: `https://github.com/gul-labs/flipbook/tree/main/packages/core`.

## Aceptación QA

Compilar, correr pruebas y publicar una sola vez después del resultado correcto. Comprobar desde el teléfono la portada, retroceso en página 2, borde izquierdo, arrastre corto que regresa, arrastre largo que confirma, avance normal, última página, video y chat. Probar Android y iPhone reales: las pruebas automatizadas no certifican el resultado táctil.
