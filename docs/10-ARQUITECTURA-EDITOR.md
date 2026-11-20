# 10 · Arquitectura vigente del editor

**HAVANA NICE QUOTES · Revisado 20 de noviembre de 2026 · Rama única `main`**

La pantalla principal no administra herramientas paralelas. Su función es componer un único estado de sesión, un modelo `Quote.designLayout` y los módulos propietarios de cada acción.

```text
src/features/editor/
├── QuoteEditorScreen.tsx               # Estilos · Datos · Diseño · Publicar
├── QuoteDesignPanel.tsx                # Entrada única al diseñador
├── QuoteDetailsPanel.tsx               # Datos e inversión
├── QuotePublishPanel.tsx               # Revisión para cliente
├── canvas/
│   ├── TemplateCanvasEditor.tsx        # Coordinador; no renderiza herramientas internamente
│   ├── components/
│   │   ├── CanvasPageToolbar.tsx       # Botones y menú + Página
│   │   ├── CanvasPagePager.tsx         # Navegación, duplicar y eliminar
│   │   ├── CanvasSheetSurface.tsx      # Hoja, tap y papelera
│   │   ├── CanvasPageContent.tsx       # Render de Carolina/editorial/hojas propias
│   │   └── CanvasEditorPanels.tsx      # Paneles de texto, foto y selección de medios
│   ├── hooks/
│   │   ├── useCanvasSelectionState.ts  # Estado UI transitorio único y clearSelection()
│   │   ├── useCanvasPageActions.ts     # Insertar, duplicar, borrar y navegar páginas
│   │   └── useCanvasTapConfirmation.ts # Tap intencional sin confundirlo con un arrastre
│   ├── interactions/
│   │   ├── createCanvasTextInteraction.ts
│   │   ├── createCanvasTextStyleActions.ts
│   │   └── createCanvasRemovalActions.ts
│   ├── media/
│   │   ├── createCanvasPhotoActions.ts # Subir/elegir/reemplazar y ordenar imágenes
│   │   ├── canvasPhotoTarget.ts        # Identificador UI → objetivo de media
│   │   └── canvasPhotoUrl.ts           # Identificador UI → URL de imagen/video
│   └── template-canvas.css
├── photos/                              # Herramientas reales de foto/video y capas
├── texts/                               # Panel de tipografía y catálogo de fuentes
├── styles/                              # Plantillas y presentación editorial
└── shared/
    ├── editor-types.ts                 # PhotoTarget y EditQuoteField compartidos
    └── pointer-intent.ts               # Gestos de interfaz
```

## Responsabilidad única y flujo

1. **`QuoteEditorScreen`** cambia de sección; **`QuoteDesignPanel`** monta el mismo `TemplateCanvasEditor`.
2. **`TemplateCanvasEditor`** coordina página activa, `Quote.designLayout`, acciones y paneles; no crea otra cotización ni otro lienzo.
3. **`hooks/useCanvasSelectionState.ts`** es dueño de estados transitorios: texto provisional, herramienta activa, selección, menú y visor. Las acciones de navegación llaman al mismo `clearSelection()`, incluyendo textos provisionales.
4. **`hooks/useCanvasPageActions.ts`** utiliza `templates/blank-pages.ts` para insertar, duplicar y eliminar hojas. Los componentes `CanvasPageToolbar` y `CanvasPagePager` solo presentan botones.
5. **`interactions/`** aplica texto, formatos, transformaciones y eliminaciones sobre el `Quote` existente; **`media/`** resuelve identificadores y actualiza referencias, sin borrar objetos R2.
6. **`photos/`** controla recorte, color, opacidad, viñeta, capas y selector de biblioteca; **`texts/`** controla tipografía, color y tamaño.
7. **`templates/`** renderiza el documento compartido por Diseño, Scroll y PageFlip. **`magazine/FlipMagazine.tsx`** sigue siendo independiente y no se reescribe para edición.

## Contratos y reglas que deben mantenerse

- Un solo `EditQuoteField` para cambios de campos, en `editor/shared/editor-types.ts`.
- Un solo `Quote.designLayout` persistido. No reintroducir `carolinaLayout`, un segundo almacén ni copias de páginas para Scroll/3D.
- Al cambiar de página, cerrar menú, selector, herramientas y borradores provisionales a través del estado compartido; evitar limpiezas manuales en otros módulos.
- Los componentes de presentación no mantienen estado de cotización ni importan al coordinador padre; las acciones y hooks no dependen de componentes de presentación.
- Mantener el motor 3D, las tres páginas originales y las páginas independientes en la misma colección de `pageOrder`.
- Un solo `main`. No crear ramas auxiliares, editores `v2`, duplicados ni PR para estos cambios. Comprobar SHA antes de cada actualización y conservar historial para rollback.
- Validar la estructura, las pruebas de regresión, TypeScript y el build. **El build no reemplaza las pruebas de gestos en Android/iPhone reales.**
- No usar GitHub Actions ni modificar D1/R2 por mantenimiento estructural.

## Estado de la fase 1–3

- Arquitectura, contratos y navegación depurados en `main`; comprobación automatizada del grafo de dependencias, sin ciclos internos y con componentes presentacionales sin estado de negocio.
- **Preparado para QA móvil**, pero no se considera comprobado en teléfonos físicos hasta realizar los recorridos de edición, gestos, guardado, videos y revista 3D.
- Cualquier problema funcional descubierto en móvil debe corregirse en su módulo propietario, conservando esta arquitectura.

## Universalización · 16/11/2026

Un único motor de edición para todas las plantillas; `template-registry.ts` contiene todas las opciones oficiales. El modelo `Quote` guarda exclusivamente `designLayout`, cuyo esquema de posiciones, fuentes y efectos se define en `carolina-layout.ts` (motor activo, también usado por la plantilla Carolina). Las páginas editoriales, de Carolina, Scroll y 3D utilizan los mismos IDs y nodos editables de fotografía, texto, tipografía, viñeta, recorte, capas y gestos.

**Cómo añadir una plantilla:** agregar su ID y nombre al registro y su hoja de estilo. Automáticamente recibirá las tres páginas, herramientas de fotos/textos, persistencia en D1, selector de imágenes R2 y lectura Scroll/3D. Para estructura exclusiva, crear un nuevo adaptador de páginas que emplee los componentes compartidos, sin duplicar el motor de edición.

**Sin lectura heredada:** se eliminó por completo el adaptador `design-layout.ts` y el campo `carolinaLayout` del código. No hay mezcla de modelos ni fallbacks. Los borradores antiguos que dependían del formato anterior pueden perder sus ediciones; la base D1 y los archivos R2 no se han borrado.

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

**Modelo único:** `designLayout` es la única fuente de verdad. `carolina-layout.ts` contiene funciones y validaciones vigentes de las plantillas, no un segundo campo de almacenamiento. No reintroducir adaptadores antiguos.

## Páginas en blanco desde cero · 17/11/2026

- `carolina-layout.ts`: `pageOrder` es una lista ordenada de identificadores estables. 0/1/2 siguen siendo Portada/Collage/Propuesta; los números >=3 son páginas limpias. Máximo 32 páginas por documento para preservar rendimiento.
- `blank-pages.ts`: funciones puras `insertBlankPage`, `shiftPage`, `duplicateBlankPage` y `removeDesignPage`, con copia profunda de estilos y limpieza de elementos eliminados.
- `CarolinaBlankPage` en `CarolinaTemplate.tsx`: hoja blanca que solo contiene `ExtraPhotos` y `ExtraTexts`. `EditorialDocument`, `CarolinaDocument`, `TemplateCanvasEditor` y `FlipMagazine` llaman a ese componente exacto.
- `createOwnTemplate` sin fuente crea `designLayout: {pageOrder:[3]}`. Las cotizaciones y plantillas existentes con páginas 0–2 siguen sin cambios.
- Los medios subidos a R2 no se borran al eliminar elementos o folios de una propuesta. Se conserva el código activo de las tres páginas originales, sin otro modelo heredado.
