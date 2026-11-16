## Fase 1 implementada · 16/11/2026

Ya existe una biblioteca independiente de video, dentro de Fotos → Videos:
- Conversión **local** sin servicios externos: Canvas + MediaRecorder + Web Audio. Mantiene audio cuando el navegador soporta la captura. Salida MP4 o WebM a un máximo de 1280 px y 24 fps, ~2.2 Mb/s de video más ~128 kb/s de audio.
- Solo se envía a R2 el archivo web convertido: el original no sale del teléfono. Si el navegador o codec no permiten la conversión, la subida se detiene con un mensaje.
- Transferencia privada R2 multipart (6 MiB por parte) y metadatos en la tabla D1 existente `media` bajo `quotes-studio/videos/`. Sin migraciones y sin activar Stream, Queues ni planes nuevos.
- Biblioteca con reproductor con audio, tamaño real y opción de enviar a Papelera; permite restaurar y eliminar definitivamente por el sistema actual. Endpoint con soporte HTTP Range autenticado para búsqueda del reproductor.
- En esta fase, el contenedor final está limitado a 512 MiB. El peso del original puede ser mayor si el dispositivo logra convertirlo. La conversión local se hace a velocidad aproximadamente real y necesita mantener la pantalla activa. No prometemos calidad idéntica bit a bit ni compatibilidad universal: hay que probar Chrome Android y Safari iOS físicamente antes de considerarlo validado.
- **El video no está conectado todavía a Portada, Scroll ni Book 3D.** Son la siguiente fase.

---

# Próxima evolución · Video en portada y revista 3D
**Estudio técnico, no implementación** · 16 de noviembre de 2026

## Resultado
Viable. Complejidad **media-alta**: el diseño y PageFlip pueden mostrar elementos de video HTML, pero el sistema de medios actualmente acepta solamente imágenes de hasta 12 MB, y el Worker responde el contenido entero sin soporte explícito de peticiones Range. La revista tiene que pausar y reanudar el video correctamente al cambiar de hoja. No afirmar que funcionará con solo añadir una etiqueta `<video>`.

## Diseño propuesto, sin duplicar módulos

1. **Tipos y guardado:** incorporar `VideoMedia` con `id`, `posterUrl`, `source`, `mime`, `duration` y `status`. Vincularlo por ID en `designLayout`, conservando `cover` y `gallery` actuales. Una portada puede ser foto **o** video. No migrar ni eliminar referencias antiguas.
2. **Biblioteca:** introducir `src/features/media/videos/` para carga, estado, miniaturas y borrado. No mezclar lógica de compresión con `PhotoBank`. Mantener un solo motor `MediaNode` para portada, Scroll y hojas 3D.
3. **Subida de videos grandes:** usar **R2 multipart** con partes y reintentos para archivos grandes (documentación R2: https://developers.cloudflare.com/r2/objects/upload-objects/). Evitar enviar todo el archivo por el Worker: los límites por solicitud suelen ser de 100 MB en Free/Pro y varían según el plan (https://developers.cloudflare.com/workers/platform/limits/). Se requieren mecanismos de subida directa y autenticación temporal sin exponer secretos.
4. **Reducción de tamaño:** salida compatible preferentemente MP4 H.264 + AAC; generar un poster estático y opciones de calidad. WebCodecs aprovecha hardware cuando está disponible, pero solo ofrece procesamiento de fotogramas, necesita multiplexar audio/video por separado y su compatibilidad varía según dispositivo: https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API. Ofrecer alternativa para dispositivos con soporte limitado; **no prometer compresión sin ninguna pérdida**. Guardar el original solo si la política de almacenamiento lo permite.
5. **Alternativa con conversión/entrega automática:** Cloudflare Stream admite subidas directas/resumibles y codificación adaptativa (https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/), **pero es un servicio con coste** por minutos almacenados y entregados: https://developers.cloudflare.com/stream/pricing/. **No activarlo ni crear facturación sin autorización explícita**.
6. **Reproducción:** `<video poster playsInline preload="metadata">` con controles de reproducción, pausa en segundo plano y al iniciar un cambio de hoja, evitar que PageFlip intercepte los gestos del reproductor, y liberar decodificadores al desmontar la hoja. Dejar las hojas sin video como imágenes ligeras. iPhone y Android requieren QA real con videos verticales/horizontales.
7. **Video privado por R2:** los reproductores buscan fragmentos mediante HTTP Range (`206 Partial Content`); antes de implementar actualizar el endpoint de medios para atender Range de forma segura. Probar cookies, caché privada y memoria. No exponer un bucket público.
8. **Compatibilidad:** la revista 3D nunca debe convertir el video en una imagen fija como sustituto permanente. Si la reproducción no es compatible, se muestra poster con opción explícita de abrir video. Mantener el texto superpuesto y el resto de los controles existentes.

## Orden seguro para la siguiente intervención
- Piloto de **un video en portada** con poster, carga privada y reproducción Scroll; pruebas de Android/iOS.
- Integración en la página equivalente del 3D, pausa en flip y gestión de controles.
- Compresión adaptativa y subida reanudable.
- Extensión opcional a collage y demás hojas después de medir consumo, calidad y fluidez.

## Condiciones de aceptación
- Sin nuevos gastos o servicios de pago sin autorización.
- Fotos y cotizaciones actuales conservadas.
- El modo libro 3D sigue funcional sin video.
- Archivo original grande y versión web no duplican innecesariamente cuota de almacenamiento.
- Se prueba carga, reproducción, cambio de hoja, scroll y recuperación de conexión en Android/iOS.
- El objetivo es **calidad visual percibida alta al menor tamaño posible**, no pérdida cero matemática.
