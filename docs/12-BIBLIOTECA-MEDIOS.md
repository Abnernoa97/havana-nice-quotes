# Biblioteca de medios · interfaz unificada y optimización (noviembre 2026)

## Organización
- `src/features/videos/MediaLibraryScreen.tsx`: navegación entre Fotografías y Videos, engranaje superior sticky, único estado del acordeón y único hook de videos mientras la vista está abierta.
- `src/features/videos/MediaLibraryStats.tsx`: recuentos de fotos y videos, bytes de ambos y suma. Barra informativa de 5 GB, **no cuota real de R2**. Las miniaturas JPEG auxiliares se excluyen de esa suma (solo originales guardados y videos convertidos).
- `src/features/photos/PhotoBank.tsx` y `src/features/videos/VideoBank.tsx`: mismas tarjetas visuales, dos columnas en móvil; pulsación para ampliar y mantener pulsado para seleccionar. Las tarjetas no muestran reproductores, nombres, pesos ni controles.
- `src/features/photos/PhotoThumbnail.tsx` y `src/features/videos/VideoPoster.tsx`: miniaturas JPEG de 480×360, sin decodificar múltiples videos al abrir la cuadrícula. El reproductor de video se instancia solo cuando se abre el visor.
- `src/features/photos/photo-thumbnails.ts` y `src/features/videos/video-posters.ts`: compresión JPEG en navegador, subida privada R2 de hasta 256 KiB; backfill perezoso y secuencial de material anterior. No se borran fotos/videos originales.
- `worker/index.ts`: /api/media/:id/thumbnail privado; `worker/videos.ts`: /api/videos/:id/poster privado. Ambos requieren sesión vinculada; fotos/videos en Papelera no exponen sus vistas previas. La purga definitiva elimina el derivado.
- `src/features/editor/photos/PhotoSourcePicker.tsx`: mismo sistema de miniaturas para escoger archivos de la nube, sin videos HTML reproduciéndose simultáneamente.
- `src/features/photos/useMediaLibrary.ts`: elimina consultas automáticas cada 20 segundos (eran globales mientras se usaba el diseñador); refresca al volver a la pestaña y cada 120 segundos solo si está visible, además de subidas y acciones explícitas.

## Auditoría: causas encontradas en el código
1. En la galería anterior, cada tarjeta contenía `<video preload="metadata" controls>`: solicitaba datos de video individualmente y activaba varios decodificadores/controles.
2. Las fotografías mostraban `photo.url` (original, hasta 12 MiB por foto) incluso en la cuadrícula; `loading="lazy"` no reduce el tamaño descargado.
3. El hook de fotos ejecutaba `refreshPhotos` cada 20 segundos aun fuera de la galería, y el selector de Diseño creaba previsualizadores de video propios.
4. El texto del encabezado quedaba cortado porque `.intro-line p` heredaba `white-space:nowrap` y propiedades de botón de las reglas globales.

## Comportamiento y límites
- La primera visita a **fotos y videos antiguos** puede requerir descargar y decodificar su original para fabricar una miniatura; luego la vista previa privada guardada evita ese coste.
- El objetivo es render rápido, pero no se garantiza latencia cero; depende de R2, red, dispositivo y caché del navegador. Debe comprobarse en Android e iPhone reales.
- Los MP4/WebM guardados siguen conservando su audio. La cuadrícula usa solo JPG; el visor a pantalla completa usa el archivo real al tocarlo.
- No se añade Cloudflare Stream, Image Resizing ni servicios de pago. Las lecturas/escrituras de R2 para miniaturas pueden contabilizar operaciones dentro del plan existente.
- La barra de 5 GB es **referencia visual**; no representa un límite real de almacenamiento. No se agregan migraciones D1.
