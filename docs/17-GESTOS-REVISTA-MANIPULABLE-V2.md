# 17 · Revista 3D manipulable — HAVANA NICE Quotes

**Referencia analizada:** `Abnernoa97/havana-nice-v2/apps/pwa/src/features/book/BookReader.tsx`, líneas 216–306 y 355–368.

## Diferencia encontrada

Quotes utilizaba los gestos/taps internos de PageFlip: `showPageCorners:true`, `disableFlipByClick:false` y botones de pasar. No enviaba al motor la trayectoria del dedo.

V2 conecta `startUserTouch`, `userMove`, `userStop` para desplegar y mantener un doblez activo mientras el usuario sigue tocando una esquina. Los movimientos verticales normales permanecen en el scroll del navegador.

## Cambios implementados

- `useMagazinePaperGesture.ts`: adaptador de eventos táctiles conectado al **mismo** objeto PageFlip. No genera otro motor ni reconstruye páginas al mover el dedo.
- `magazine-gesture-intent.ts`: umbrales puros y verificables que diferencian esquina, desplazamiento vertical, doblez deliberado y toque rápido.
- `FlipMagazine.tsx`: uso de la configuración de V2 `autoSize:false`, `flippingTime:650`, `disableFlipByClick:true` y esquinas de hover solo en mouse; altura definida por el CSS existente de Quotes.
- Permite mantener la hoja en un punto intermedio, retroceder o avanzar con el dedo y mover la curva hacia arriba o abajo **mientras el dedo siga presionando**; al soltar, PageFlip decide si termina de pasar o vuelve.
- Los botones siguen funcionando; el botón de página anterior usa el rectángulo real del motor (corrección V2 para `page-flip@2.0.7`).
- La presentación satinado-metálica del paquete anterior permanece; no se modifica `flip-magazine.css`, la base de datos ni el contenido de las cotizaciones.

## Control de calidad

`tests/magazine-paper-gesture.test.mjs` verifica intenciones del gesto y conexión del mismo motor; la suite de regresión verifica video, fotos, textos y Scroll. Pruebas en Android e iPhone **pendientes** para confirmar sensibilidad, límites de la hoja y feedback visual.
