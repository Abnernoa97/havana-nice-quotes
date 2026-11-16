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
