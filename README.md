# HAVANA NICE · Quotes Studio

**Aplicación editorial de cotizaciones de HAVANA NICE.**

> **Estado: prototipo funcional / uso exclusivo de demostración.** No hay backend, autenticación, sincronización, envío comercial, aceptación contractual ni firma real. **No introducir datos de clientes reales.**

## Empieza aquí

Esta carpeta es la **fuente de verdad del proyecto**. Permite retomar el desarrollo desde otro chat sin reinterpretar decisiones ni modificar aplicaciones ajenas.

| Documento | Para qué sirve |
| --- | --- |
| [01 · Estado actual](docs/01-ESTADO-ACTUAL.md) | Qué existe, qué se ha comprobado y qué sigue siendo demo |
| [02 · Arquitectura](docs/02-ARQUITECTURA.md) | Código, dependencias, datos, infraestructura y riesgos |
| [03 · Visión del producto](docs/03-VISION-DEL-PRODUCTO.md) | Experiencia editorial y libertad del editor |
| [04 · Roadmap](docs/04-ROADMAP.md) | Fases por prioridad y condiciones de aceptación |
| [05 · Protocolo de desarrollo](docs/05-PROTOCOLO-DE-DESARROLLO.md) | Cómo cambiar, comprobar, publicar y regresar |
| [06 · Registro de decisiones](docs/06-DECISIONES.md) | Decisiones tomadas y puntos todavía abiertos |

## Identidad de este proyecto

- **Repositorio exclusivo:** `Abnernoa97/havana-nice-quotes` (rama `main`).
- **Publicación existente:** https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Cuenta de despliegue:** Cloudflare **Solo Aplicaciones**. No intervenir en otras cuentas ni proyectos.
- **Plataforma:** React + Vite + TypeScript + Cloudflare Workers Static Assets.
- **Formato actual:** PWA instalable en Android; el usuario confirmó que pudo instalarla.
- **Presentación:** Estilos editoriales, Scroll y Page Flip 3D.
- **Auditoría de código:** 15 de noviembre de 2026, sobre el commit `d129e426`. No se comprobó el despliegue en vivo de esa versión desde el conector.

## Desarrollo local

```bash
npm install
npm run dev
npm run build
```

**Cloudflare:** rama `main`; build `npm run build`; deploy `npx wrangler deploy`; assets `./dist`, definidos en `wrangler.jsonc`.

El propósito de esta documentación es **ordenar lo existente, no reescribir la aplicación**. Primero verificar y estabilizar; después evolucionar de forma incremental.

**HAVANA NICE · Fer & Noa**
