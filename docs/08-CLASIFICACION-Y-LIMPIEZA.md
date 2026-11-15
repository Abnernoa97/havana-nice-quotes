# 08 · Clasificación de carpetas y limpieza controlada

> **Nota histórica:** este archivo describe el inventario previo a la modularización del 15/11. Para la estructura real y los identificadores de Cloudflare, leer primero [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md).

**Punto:** QN-00.05 · **Corte:** 15/11/2026 · **Base verificada:** `f3f83e5c6e83b20d7bff757f29cb23523cf1dced`.

Este documento es el **inventario de trabajo** para cada limpieza posterior. No confundir el aspecto ordenado de las carpetas con la eliminación indiscriminada de código. La app ya está instalada y sus cotizaciones existen en `localStorage`: cambios de origen, clave, estructura del documento o caché pueden comprometer el acceso a borradores.

## 1. Árbol real encontrado

```text
havana-nice-quotes/
├── .gitignore
├── README.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── docs/
│   ├── 01-ESTADO-ACTUAL.md
│   ├── 02-ARQUITECTURA.md
│   ├── 03-VISION-DEL-PRODUCTO.md
│   ├── 04-ROADMAP.md
│   ├── 05-PROTOCOLO-DE-DESARROLLO.md
│   ├── 06-DECISIONES.md
│   └── 07-RESPALDO.md
├── public/
│   ├── _headers
│   ├── robots.txt
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── EditorialStyles.tsx
    ├── editorial-styles.css
    ├── FlipMagazine.tsx
    └── flip-magazine.css
```

La estructura física es **pequeña**, no está saturada de carpetas. El problema principal es la **concentración de responsabilidades** en `src/App.tsx` (más de 40 KB): datos, navegación, UI, mensajes simulados, exportación de respaldo y lógica de vista del cliente están juntos.

## 2. Clasificación por responsabilidad

| Origen | Responsable de | Acción actual |
| --- | --- | --- |
| `src/App.tsx` | Pantallas, estado local, editor, precios, respaldo | **CONSERVAR**. Dividir después en pequeños pasos con pruebas |
| `src/main.tsx` | Arranque + PWA | **CONSERVAR**. No cambiar origen ni registro del Service Worker |
| `src/FlipMagazine.tsx` | Revista 3D y seis hojas fijas | **CONSERVAR**. No alterar el pliegue aprobado |
| `src/flip-magazine.css` | Lector y efecto de páginas | **CONSERVAR** junto al lector |
| `src/EditorialStyles.tsx` | Biblioteca y selector Estilos | **CONSERVAR**. Mover con CSS juntos más adelante |
| `src/editorial-styles.css` | Miniaturas y variaciones editoriales | **CONSERVAR**. Revisar acoplamiento de selectores en una fase posterior |
| `src/index.css` | Reglas globales y varias vistas | **REVISAR**. Dividir solo después de pruebas visuales comparativas |
| `public/manifest.webmanifest` | Manifest PWA e íconos | **NO MOVER** sin plan de actualización |
| `public/sw.js` | Caché y actualización PWA | **NO TOCAR** sin comprobar el efecto en dispositivos instalados |
| `public/icon-*.png` | Íconos del instalador | **CONSERVAR** rutas actuales |
| `public/_headers`, `robots.txt` | Cabeceras y robots | **CONSERVAR** |
| `docs/` | Estado, decisiones, roadmap y respaldo | **CLASIFICADO** y enlazado desde README |
| Configuración raíz | Compilación, dependencias y despliegue | **CONSERVAR**; añadir solo reglas de higiene |

**Duplicados verificados:** no se encontraron archivos de respaldo con sufijos `-copy`, `-old`, `-v2` ni ramas visibles de código obsoleto en el árbol de `main`. Esto **no** demuestra que el código interno esté libre de repeticiones. Queda pendiente una auditoría de funciones y CSS antes de eliminar nada.

## 3. Arquitectura objetivo — todavía NO creada

```text
src/
  app/                    # estado y composición de la aplicación
  features/
    quotes/               # documentos, persistencia, exportación y futura importación
    editor/               # editor y administrador de páginas
    editorial-styles/     # biblioteca, componentes y CSS de estilos
    magazine/             # vista 3D y CSS del pliegue
    messages/             # mensajería (hoy simulada)
  shared/
    components/           # interfaz de uso común
    lib/                  # formatos de fecha, moneda, validación
    styles/               # estilos globales, variables
  main.tsx
```

Mover archivos a esta estructura **no es objetivo inmediato**: primero se debe verificar el respaldo externo de las cotizaciones. Tampoco crear carpetas vacías para aparentar orden.

## 4. Primera limpieza no destructiva efectuada

- [x] Inventario de rutas reales del repositorio.
- [x] Definición de responsabilidades y estructura futura.
- [x] Configuración de estilo editor: `.editorconfig`.
- [x] Protección de archivos temporales: `.gitignore`.
- [x] Comando **`npm run audit:structure`** (solo lectura), en `scripts/project-audit.mjs`.
- [ ] Comprobar en entorno local el comando de auditoría con todo el proyecto.
- [ ] Descargar y verificar respaldo JSON del Samsung.
- [ ] Descargar copia ZIP en soporte externo.
- [ ] Medir CSS redundante, iconos/importaciones no usadas y componentes duplicados.
- [ ] Separar utilidades y datos de `App.tsx`, un commit funcional cada vez.
- [ ] Reubicar componentes/CSS únicamente cuando todos los imports y la PWA estén probados.

## 5. Reglas para no acumular basura

1. Ningún archivo `backup-old.tsx`, `new-new.css` o carpeta `final-v3` en el código activo.
2. No duplicar componentes para probar estilos: usar control de versiones y pruebas.
3. No hacer limpiezas visuales y de datos en un mismo commit.
4. No crear servicios de pago, backend, nuevo Worker ni un repositorio alternativo para reorganizar.
5. Cada traslado debe preservar su comportamiento y actualizar importaciones, pruebas y documentación en el mismo commit.
6. Verificar siempre **build + deploy + visual en Android**, no solo éxito en GitHub.
7. `docs/` contiene decisiones y procedimientos; `scripts/` solo verificaciones o herramientas locales, nunca despliegues destructivos por defecto.

## 6. Próximo punto concreto

**Estado nuevo:** QN-00.06–00.08 modularizaron y publicaron paneles Datos, Diseño y Precios, datos ficticios y formateadores. Sigue pendiente la auditoría y limpieza integral del [plan Nivel Dios, QN-00.09](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). El respaldo JSON ficticio no es bloqueo.

**Referencia de recuperación antes de cambios estructurales:** commit `f3f83e5`; Cloudflare debe conservarse verificado por ID de despliegue antes de modificar código.
