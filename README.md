# HAVANA NICE · Quotes Studio

**Cotizaciones editoriales de HAVANA NICE — prototipo exclusivamente visual.** Todas las parejas, conversaciones, montos y cotizaciones actuales son ficticios. **No usar datos reales de clientes:** todavía no hay autenticación, backend, firma, pagos, enlaces privados ni envío comercial.

## Primero leer estos documentos

| Documento vigente | Para qué sirve |
| --- | --- |
| **[Estado actual y estructura](docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md)** | Qué existe realmente y qué sigue pendiente |
| [Visión del producto](docs/03-VISION-DEL-PRODUCTO.md) | Qué queremos construir y qué NO existe aún |
| [Roadmap](docs/04-ROADMAP.md) | Próximas fases, separadas de la limpieza |
| [Protocolo de desarrollo](docs/05-PROTOCOLO-DE-DESARROLLO.md) | Reglas para editar, probar, publicar y recuperar |
| [Decisiones](docs/06-DECISIONES.md) | Restricciones y elecciones confirmadas |
| [Índice histórico](docs/HISTORIAL.md) | Documentos retirados del árbol activo, recuperables desde Git |
| **[Issue #3 · Plan Nivel Dios](https://github.com/Abnernoa97/havana-nice-quotes/issues/3)** | Checklist comprobable y registro de ejecución |

**Un solo repositorio:** `Abnernoa97/havana-nice-quotes`. **Una sola rama:** `main`.  
**Producción:** https://havana-nice-quotes.soloaplicaciones97.workers.dev — Cloudflare, cuenta **Solo Aplicaciones**, Worker `havana-nice-quotes`.

## Estado técnico verificado (15 nov 2026)

- React 19 + Vite + TypeScript estricto + PWA + Cloudflare Workers Static Assets.
- Inicio, Cotizaciones, Editor, Mensajes y Vista cliente separados por módulos.
- Cinco estilos editoriales, lectura Scroll y revista Page Flip 3D de **seis hojas fijas**.
- Persistencia **solo local** bajo `hn_quotes_visual_v1`; cotizaciones y mensajes **simulados**.
- `App.tsx` de 279 líneas; `bun.lock` versionado; sin `@ts-nocheck`; sin formateador USD duplicado.
- **23/23 pruebas** y compilación Cloudflare aprobadas para el último cambio de aplicación `38c71ab94a78a553214f6db34e9ccab0a7ef57ca`. La versión del HEAD puede ser posterior por cambios documentales.
- **La revisión visual/táctil en Samsung y escritorio NO está cerrada**. El comportamiento del doblez 3D se optimizará después, no durante esta limpieza.
- Solo existe `main`; la rama temporal de QA y su preview fueron eliminados manualmente y comprobados el 15/11/2026.

## Desarrollo local

```bash
bun install --frozen-lockfile
npm run dev
npm run build
```

`npm run build` ejecuta auditoría de estructura, tests, TypeScript y Vite. También se pueden ejecutar `npm test` y `npm run audit:structure` por separado.

**Publicación:** cambios de `main` disparan Workers Builds. Revisar el resultado real del build y la versión Cloudflare; cada commit puede consumir minutos de compilación. No generar builds por cambios triviales ni crear Workers adicionales.

**Qué sigue:** terminar la validación de uso y, cuando se decida, diseñar **páginas editables** (añadir, duplicar, reordenar y eliminar) sin reescribir el motor 3D. La velocidad, detalles de animación y rediseños están pospuestos.

**Regla:** trabajar desde este `README`, estado vigente e Issue #3; no desde documentos históricos. Los archivos borrados de `docs/` siguen recuperables en el historial Git.
