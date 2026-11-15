# HAVANA NICE · Quotes Studio

**Aplicación editorial de cotizaciones de HAVANA NICE.**

> **Estado: prototipo funcional / uso exclusivo de demostración.** No hay backend, autenticación, sincronización, envío comercial, aceptación contractual ni firma real. **No introducir datos de clientes reales.**

> **Estado vigente — 15/11/2026:** todas las cotizaciones y datos actuales son ficticios; siguen siendo pruebas de un prototipo visual. No hay datos reales que respaldar ni un requisito de exportación JSON para continuar la limpieza. [Fuente de verdad actual](docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md) · [Plan Nivel Dios, QN-00.09](https://github.com/Abnernoa97/havana-nice-quotes/issues/3).

## Empieza aquí

Esta carpeta es la **fuente de verdad del proyecto**. Permite retomar el desarrollo desde otro chat sin reinterpretar decisiones ni modificar aplicaciones ajenas.

| Documento | Para qué sirve |
| --- | --- |
| **[09 · Estado vigente y limpieza](docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md)** | **Punto de entrada único: código publicado, módulos, deuda y próximos pasos** |
| [01 · Estado actual](docs/01-ESTADO-ACTUAL.md) | Qué existe, qué se ha comprobado y qué sigue siendo demo |
| [02 · Arquitectura](docs/02-ARQUITECTURA.md) | Código, dependencias, datos, infraestructura y riesgos |
| [03 · Visión del producto](docs/03-VISION-DEL-PRODUCTO.md) | Experiencia editorial y libertad del editor |
| [04 · Roadmap](docs/04-ROADMAP.md) | Fases por prioridad y condiciones de aceptación |
| [05 · Protocolo de desarrollo](docs/05-PROTOCOLO-DE-DESARROLLO.md) | Cómo cambiar, comprobar, publicar y regresar |
| [06 · Registro de decisiones](docs/06-DECISIONES.md) | Decisiones tomadas y puntos todavía abiertos |
| [07 · Respaldo y recuperación](docs/07-RESPALDO.md) | Historial y exportación opcional de datos ficticios; no bloquea desarrollo |
| [08 · Clasificación y limpieza](docs/08-CLASIFICACION-Y-LIMPIEZA.md) | Inventario verificado, estructura futura y normas de limpieza |

## Identidad de este proyecto

- **Repositorio exclusivo:** `Abnernoa97/havana-nice-quotes` (rama `main`).
- **Publicación existente:** https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Cuenta de despliegue:** Cloudflare **Solo Aplicaciones**. No intervenir en otras cuentas ni proyectos.
- **Plataforma:** React + Vite + TypeScript + Cloudflare Workers Static Assets.
- **Formato actual:** PWA instalable en Android; el usuario confirmó que pudo instalarla.
- **Presentación:** Estilos editoriales, Scroll y Page Flip 3D.
- **Última versión publicada comprobada:** commit `4bbeb050c905de02cb1861d824ee2591ba4b9158`; despliegue `08a2f77d-46dd-4360-ad8d-1d7a68b5e66a` (Cloudflare, 100 % del tráfico al 15/11/2026).
- **Alcance:** solo demo visual con muestras ficticias. El lector 3D tiene seis hojas fijas; gestor de páginas, editor libre y backend aún no existen.
- **Higiene pendiente:** `App.tsx` sigue en 1,002 líneas, tres componentes usan `@ts-nocheck`, CSS y formateadores requieren auditoría; falta lockfile de dependencias.
- **Ramas:** `main` y la rama temporal `work/qn-00-07-modularizacion` tienen los mismos 35 archivos; la temporal aún requiere eliminación en GitHub.

## Desarrollo local

```bash
npm install
npm run dev
npm run build
npm run audit:structure
```

**Cloudflare:** rama `main`; build `npm run build`; deploy `npx wrangler deploy`; assets `./dist`, definidos en `wrangler.jsonc`.

El propósito de esta documentación es **ordenar lo existente, no reescribir la aplicación**. Primero verificar y estabilizar; después evolucionar de forma incremental.

**HAVANA NICE · Fer & Noa**
