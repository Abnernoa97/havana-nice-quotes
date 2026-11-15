# 02 · Arquitectura actual

> **Nota histórica:** este archivo describe el inventario previo a la modularización del 15/11. Para la estructura real y los identificadores de Cloudflare, leer primero [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md).

## Mapa simple

```text
Samsung / navegador / PWA
    ↓
Cloudflare Workers Static Assets (archivos construidos por Vite)
    ↓
React (cliente, sin backend)
    ├── Inicio
    ├── Cotizaciones
    ├── Diseñador
    │    ├── Datos · Diseño · Estilos · Precios
    │    ├── Vista embebida de propuesta
    │    └── Vista cliente (Scroll / Revista 3D)
    └── Mensajes (demo)
    ↓
localStorage del dispositivo
    └── clave: hn_quotes_visual_v1
```

## Archivos reales

| Archivo | Responsabilidad actual |
| --- | --- |
| `src/main.tsx` | Arranque React y registro HTTPS del Service Worker |
| `src/App.tsx` | Estado y composición principal: aprox. 33 KB, 1,002 líneas; todavía pendiente de dividir |
| `src/EditorialStyles.tsx` | Selector y metadatos de cinco estilos |
| `src/editorial-styles.css` | Miniaturas y reglas visuales de estilos; incluye sobreescrituras sobre otras vistas |
| `src/FlipMagazine.tsx` | Lector 3D de seis páginas; implementación con `page-flip` 2.0.7 |
| `src/flip-magazine.css` | Diseño de hojas, sombras y controles de la revista |
| `src/index.css` | Estilos generales, editor y vistas originales |
| `public/manifest.webmanifest` | Instalación PWA y configuración standalone |
| `public/sw.js` | Caché del shell y recursos estáticos; no es respaldo de cotizaciones |
| `public/icon-192.png`, `icon-512.png` | Íconos Android |
| `public/_headers`, `public/robots.txt` | Directivas HTTP y robots |
| `wrangler.jsonc` | Despliegue Cloudflare Workers con assets de `dist` |
| `package.json` | React 19, Vite 6, TypeScript, lucide-react, page-flip |

## Módulos publicados en QN-00.08

- `src/features/editor/QuoteDetailsPanel.tsx`, `QuoteDesignPanel.tsx`, `QuotePricingPanel.tsx`: los tres paneles ya están extraídos.
- `src/features/quotes/demo-data.ts`: muestra de cotizaciones y fotos **ficticias**.
- `src/shared/lib/formatters.ts`: formato de fechas y dólares.
- `FlipMagazine.tsx` conserva otro formateador USD; su unificación aún está pendiente.
- GitHub `main`: `4bbeb050`; Cloudflare despliegue `08a2f77d-46dd-4360-ad8d-1d7a68b5e66a` verificado.

## Datos actuales

Cada cotización contiene campos de ejemplo como:

```text
id, name, client, email, location, date,
price, deposit, status, cover, font, color,
note, package, desc, messages
```

Campos opcionales añadidos en etapas recientes: `style` (p. ej. `vogue`, `lane`, `junebug`, `nyt`, `libre`) y `readingMode` (`flip` o `scroll`). El render usa valores predeterminados para borradores que aún no los tienen.

El estado se carga de `localStorage.getItem('hn_quotes_visual_v1')` al iniciar y se persiste después de cambios mediante un efecto React. **Guardar** muestra una confirmación, pero no escribe en un servidor. Fotos cargadas del teléfono se leen como Data URL/base64 y también pueden terminar en ese mismo almacenamiento.

## Dependencias externas visibles

- Fuentes Google Fonts, cargadas desde CSS.
- Fotografías de muestra de Unsplash (URLs externas).
- Biblioteca de efecto `page-flip`.

El shell de la PWA puede cachearse; **no significa que la experiencia completa sea offline ni que exista sincronización**.

## Organización progresiva

Ver el [inventario real, la clasificación y la estructura objetivo de QN-00.05](08-CLASIFICACION-Y-LIMPIEZA.md). En esta etapa no se movieron componentes ni se modificó la clave `hn_quotes_visual_v1`.

## Deuda técnica detectada

1. `src/App.tsx` es demasiado central: incorpora UI, datos, reglas y simulaciones. Hay riesgo de romper funciones al modificar una sección.
2. Componentes `App.tsx`, `EditorialStyles.tsx` y `FlipMagazine.tsx` utilizan `// @ts-nocheck` (la comprobación de tipos está deshabilitada en ellos).
3. La revista tiene **seis hojas fijas**, no un modelo de páginas editable.
4. Las reglas de estilos atraviesan distintos componentes mediante CSS, lo que puede producir interferencias.
5. No hay backend, pruebas automatizadas, editor de capas, historial de deshacer, migraciones ni control de versiones del esquema de cotizaciones.
6. El repositorio inspeccionado no contiene un lockfile versionado; el proceso de instalación puede resolver versiones transitivas diferentes.
7. El Service Worker tiene un nombre de caché fijo; prever versionado y política de actualización para evitar contenido antiguo.

## Arquitectura futura — propuesta, NO implementada

```text
UI de administración
  ├── Cotizaciones
  ├── Editor de páginas (capas, posición, estilos, medios)
  └── Publicación/lectura de cliente
        ↓
Modelo de documento versionado
        ↓
API con identidad y permisos por cliente
        ├── Base de datos
        ├── Almacenamiento de imágenes
        ├── Conversaciones y actividad
        └── Aceptación / contratos
```

La elección de backend, dominio y costos queda **pendiente de aprobación explícita**. No crear recursos facturables por inercia.
