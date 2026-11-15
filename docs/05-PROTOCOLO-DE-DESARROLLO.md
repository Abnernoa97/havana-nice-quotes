# 05 · Protocolo de desarrollo y publicación

## Proyecto autorizado

- **Repositorio único:** `Abnernoa97/havana-nice-quotes`; rama principal y única permanente `main`.
- **Publicación única:** Cloudflare cuenta **Solo Aplicaciones**, Worker `havana-nice-quotes`.
- No intervenir en Calendario, ABNEROS, otras apps, proveedores o cuentas.
- No habilitar recursos de pago, dependencias importantes ni nuevos servicios sin autorización.

## Orden de trabajo

1. Leer [estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md), [roadmap](04-ROADMAP.md) e [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3).
2. Verificar **por separado** HEAD de GitHub y versión del Worker en Cloudflare. No asumir que estar en `main` equivale a estar publicado.
3. Precisar el problema y los archivos involucrados. No mezclar limpieza con mejoras de animación.
4. Mantener un cambio lógico por commit, con una sola implementación vigente por función.
5. Para cambios de código, ejecutar auditoría, tests, TypeScript y build; revisar logs. Un build correcto **no reemplaza** pruebas reales de interfaz.
6. Publicar únicamente cambios verificados, preferiblemente agrupando ediciones documentales para no gastar minutos en builds superfluos.
7. Registrar SHA, build, deployment y resultados en el Issue correspondiente. Si falla, corregir la causa antes de nuevos cambios.

## Comandos de validación

```bash
bun install --frozen-lockfile
npm run audit:structure
npm test
npm run build
```

`npm run build` incluye auditoría, pruebas, `tsc --noEmit` y `vite build`. Las versiones de dependencias están en `bun.lock`. No inventar lockfiles ni editar resoluciones a mano.

## Seguridad de la demo

- Todas las cotizaciones son **ficticias**. El repositorio es público y la app no tiene login: **no ingresar clientes reales**.
- Persistencia bajo `hn_quotes_visual_v1`; no cambiar clave/esquema sin una migración validada.
- Envío, mensajes y aceptación son simulaciones; no describirlos como contratos o firmas reales.
- No limpiar datos/caché del Samsung sin necesidad ni consentimiento: la PWA guarda borradores locales.
- Conservar historial Git y deployments Workers para rollback. No crear archivos `*-old.tsx`, `backup.css`, carpetas `v2` ni ramas de respaldo permanente.

## Prueba visual y funcional (pendiente hasta comprobarla)

- Inicio, navegación y botón atrás, Cotizaciones, nueva/editar/reabrir, búsqueda y filtros.
- Datos, cinco estilos, fotografía, fuente, color, Precios USD/anticipo y vista cliente Scroll.
- Revista 3D en Samsung/escritorio: arrastre, esquinas, frente/reverso, sombra, primer/último folio y regreso al editor.
- Estados vacíos, mensajes demo, recarga, caché PWA, accesibilidad, anchos móviles y consola.
- Comparar capturas antes/después en cambios visuales. **Si algo no se pudo probar, dejarlo como pendiente.**

## Ramas y costos

Actualmente **solo existe `main`**; la rama temporal anterior y su Preview se eliminaron. Si un cambio futuro necesita QA aislada, decidir una rama **estrictamente temporal**, no activar builds automáticos innecesarios y retirarla después de integrar; no dar por hecho que la conexión GitHub puede eliminar ramas. Mantener solo una fuente de producción.

## Continuidad

El estado de una tarea siempre distingue cuatro niveles: **código escrito → build probado → versión publicada → interfaz comprobada**. No llamar `100 %` a una etapa que solo ha compilado.
