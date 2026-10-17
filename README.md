# HAVANA NICE — Quotes Studio

Aplicación independiente para diseñar propuestas personalizadas y, más adelante, gestionar conversaciones, aceptación y Service Agreements de parejas que celebran su boda en México.

## Estado actual

**Fase 1: DEMO VISUAL.** Datos ficticios y fotografías de muestra. No contiene backend, autenticación, envío real, firma legal ni sincronización entre dispositivos.

La aplicación definitiva es una **demo visual independiente**, preparada para publicarse en **Cloudflare Workers (Static Assets)** desde el repositorio GitHub de Solo Aplicaciones. No depende de AppDeploy.

### Cloudflare Workers — Solo Aplicaciones

- Framework: React (Vite)
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler preview` (opcional)
- Static assets: `./dist` (configurado en `wrangler.jsonc`)
- Root directory: repository root

### Desarrollo

```bash
npm install
npm run dev
npm run build
```

## Próximas fases

1. Aprobar la estética visual y la navegación en teléfono.
2. Crear proyecto nuevo y aislado de Supabase, con permisos privados y autentificación.
3. Almacenar cotizaciones y activos, mensajería en vivo con autorización.
4. Incorporar generación de enlaces privados, avisos de entrega, firma de Service Agreement por un proveedor verificable.

## Privacidad

Nunca subir credenciales, `.env`, nombres de clientes reales ni documentos firmados al repositorio. La demo usa `localStorage` únicamente en el navegador actual; no sincroniza equipos y no sustituye la plataforma comercial.

**HAVANA NICE · By Fer & Noa**
