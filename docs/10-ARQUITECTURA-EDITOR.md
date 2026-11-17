# 10 · Arquitectura vigente del editor

**HAVANA NICE QUOTES · 16 de noviembre de 2026 · Rama de producción `main`**

```text
src/features/editor/
├── QuoteEditorScreen.tsx          # Datos · Estilos · Diseño · Publicar
├── QuoteDesignPanel.tsx           # Entrada al diseñador
├── styles/                        # Estilos editoriales existentes
├── canvas/
│   ├── TemplateCanvasEditor.tsx   # Selección, páginas, texto, foto, papelera
│   └── template-canvas.css
├── photos/
│   ├── PhotoEditingWorkspace.tsx  # Pantalla de edición y gestos de recorte
│   ├── PhotoStyleDock.tsx         # Color, fondo, opacidad, viñeta, giro
│   ├── PhotoSourcePicker.tsx      # Teléfono o banco de fotos R2
│   ├── PhotoLayersPanel.tsx       # Recuperar imágenes detrás de textos
│   ├── photo-layers.ts            # Selector puro de capas
│   └── *.css                      # Estilos propios de fotos
├── texts/
│   ├── TextStyleDock.tsx          # Fuente, color, tamaño, ancho, alto
│   ├── ElegantFontBank.tsx        # Catálogo de fuentes
│   └── *.css                      # Estilos propios de textos
└── shared/
    └── editor-types.ts           # Tipos comunes de selección de foto
```

## Una sola fuente por función

- **Edición de píxeles** (color, recorte, opacidad, giro, viñeta): `editor/photos/`. No existe una segunda ruta de efectos en el lienzo.
- **Edición de texto**: `editor/texts/`. Guarda estilos por ID, sin cambiar la plantilla fuente.
- **Selección y páginas**: `editor/canvas/`. Coordina acciones y guardado de la cotización.
- **Vista compartida**: `src/features/templates/` sigue siendo el render de Portada, Collage y Propuesta usado también por Scroll/3D.
- **Gesto compartido**: `templates/useCarolinaGesture.ts` solo mueve/gira/escala el marco cuando se mantiene pulsado; el editor de fotografía a pantalla completa posee recorte y efectos.
- **Modelo de recorte y persistencia**: `templates/photo-crop.ts` y `carolina-layout.ts`.
- **Revista 3D**: `src/features/magazine/FlipMagazine.tsx`, independiente y sin modificar en esta reorganización.

## Dónde corregir los problemas futuros

| Problema | Archivo propietario |
|---|---|
| No cambia la hoja, selección, borrar elemento | `canvas/TemplateCanvasEditor.tsx` |
| Foto tapada, editar/mover/borrar capa | `photos/PhotoLayersPanel.tsx` y `photo-layers.ts` |
| Recorte, zoom, giro con dedos | `photos/PhotoEditingWorkspace.tsx` + `templates/photo-crop.ts` |
| Fondo, color, opacidad, viñeta | `photos/PhotoStyleDock.tsx` + `templates/CarolinaPhotoNode.tsx` |
| Teléfono / banco de fotografías | `photos/PhotoSourcePicker.tsx` |
| Tipografía, color o expansión de letras | `texts/TextStyleDock.tsx` |
| Catálogo de letras | `texts/ElegantFontBank.tsx` |
| Efectos de revista 3D | `magazine/FlipMagazine.tsx` |

## Reglas

1. Cada función tiene **un solo módulo propietario**. No crear copias `v2`, `old` o parches CSS para ocultar componentes viejos.
2. Mover archivos significa eliminar los anteriores del árbol Git, actualizar imports y pruebas de regresión.
3. No cambiar esquemas D1/R2 ni eliminar medios del banco al borrar referencias del diseño.
4. Mantener las tres páginas, scroll, revista 3D, guardado y controles aprobados.
5. Validar con auditoría, tests, TypeScript, build Cloudflare y deployment. El comportamiento táctil en Android requiere prueba física adicional.
6. No habilitar GitHub Actions ni proveedores nuevos para este mantenimiento.

## Universalización · 16/11/2026

Un único motor de edición para todas las plantillas; `template-registry.ts` contiene todas las opciones oficiales. `design-layout.ts` define `designLayout` y su lectura de compatibilidad con `carolinaLayout` sin modificar ni eliminar cotizaciones antiguas. Las páginas editoriales, de Carolina, Scroll y 3D utilizan los mismos IDs y nodos editables de fotografía, texto, tipografía, viñeta, recorte, capas y gestos.

**Cómo añadir una plantilla:** agregar su ID y nombre al registro y su hoja de estilo. Automáticamente recibirá las tres páginas, herramientas de fotos/textos, persistencia en D1, selector de imágenes R2 y lectura Scroll/3D. Para estructura exclusiva, crear un nuevo adaptador de páginas que emplee los componentes compartidos, sin duplicar el motor de edición.

**Importante:** la migración de diseños viejos es *de lectura*: `designLayout ?? carolinaLayout`; la primera modificación guarda el modelo universal. El campo antiguo queda conservado como respaldo. No migrar masivamente cotizaciones D1 sin consentimiento y respaldo.

## Medios: módulos vigentes

- `src/features/videos/MediaLibraryScreen.tsx`: navegación entre Fotos y Videos y único engranaje superior compartido.
- `src/features/videos/MediaLibraryStats.tsx`: contadores combinados y referencia visual de 5 GB.
- `src/features/videos/VideoBank.tsx`, `VideoPoster.tsx`, `video-posters.ts`, `compress-video.ts` y `useVideoLibrary.ts`: galería, miniaturas, conversión y subida de videos.
- `src/features/photos/PhotoBank.tsx`, `PhotoThumbnail.tsx`, `photo-thumbnails.ts` y `useMediaLibrary.ts`: fotografías, miniaturas y subida independientes.
- `src/features/media/formatMediaBytes.ts`: formateador compartido de almacenamiento.
- `src/features/editor/photos/PhotoSourcePicker.tsx`: selector de archivos de la nube que reaprovecha las miniaturas.
- `src/features/templates/CoverMediaNode.tsx` y `src/features/magazine/FlipMagazine.tsx`: portada foto/video, Scroll y Revista 3D; video de portada en bucle, silencioso y sin controles.
- `worker/index.ts` y `worker/videos.ts`: medios y miniaturas privados, borrado de derivados al purgar.

El código antiguo de reproductores por tarjeta y estadísticas duplicadas se retiró. Las miniaturas antiguas se generan secuencialmente para evitar consumo simultáneo de varios decodificadores.

**Mantener:** adaptador `carolinaLayout` para propuestas guardadas anteriormente. No migrar ni borrar datos reales sin respaldo.
