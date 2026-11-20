# Cursor nativo y papel satinado · noviembre de 2026

## 1. Corrección de cursor táctil

- En modo edición, el nodo `contentEditable='plaintext-only'` no registra los gestos de arrastre; Android/iPhone maneja el cursor, la selección y las manijas de forma nativa.
- El primer toque puede ubicar el cursor en el punto presionado, usando `caretPositionFromPoint` o `caretRangeFromPoint`; si el navegador no ofrece ubicación válida, inicia al final, sin reposicionar en los siguientes toques.
- El menú contextual y `-webkit-touch-callout` nativos se restauran exclusivamente durante la edición.
- La captura global para confirmar transformaciones ignora los toques dentro de texto activo.
- Una vez cerrado el editor, los gestos de pulsación prolongada/arrastre y la papelera vuelven a funcionar.
- **QA físico pendiente:** editar `HAVANA NICE`, tocar dentro de `HAVANA`, insertar una letra, seleccionar una palabra con manijas, borrar en medio, confirmar, reabrir y comprobar que quedó guardado. Verificar Android y iPhone.

## 2. Acabado revista 3D basado en HAVANA NICE V2

**Referencia real:** `Abnernoa97/havana-nice-v2/apps/pwa/src/features/book/book.css` y `BookReader.tsx` (`main`).

V2 usa la misma biblioteca `page-flip`, sombra de la biblioteca (`drawShadow:true`, `maxShadowOpacity:0.72`) y decoraciones estáticas: sombreado radial de la encuadernación, bordes del papel, sombras interiores y pequeños brillos satinados. Trasladamos este tratamiento al CSS de Quotes sin copiar su contenido editorial ni modificar la arquitectura de los tres modos Diseño/Scroll/3D.

- Se añade luz ambiental bajo el libro, sombra estática y profundidad de encuadernación.
- Cada hoja obtiene un reborde fino y un gradiente lateral satinado, sin una segunda animación ni filtros GPU.
- Los pseudo-elementos no interceptan eventos táctiles.
- Se mantiene el motor PageFlip existente, `flippingTime:1080`, imágenes, textos, videos y navegación.
- **QA físico pendiente:** primera hoja, hojas intermedias, hoja final y doblez a izquierda/derecha, con la referencia V2 lado a lado en Android y iPhone.

El código no cambia los registros, multimedia ni los bindings D1/R2. Se debe comprobar la compilación completa y el deploy de Cloudflare antes de marcar esta etapa como publicada.
