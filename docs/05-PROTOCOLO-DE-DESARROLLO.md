# 05 · Protocolo de desarrollo y publicación

## Proyecto autorizado

- **Repositorio único:** `Abnernoa97/havana-nice-quotes`; rama principal y única permanente `main`.
- **Publicación única:** Cloudflare cuenta **Solo Aplicaciones**, Worker `havana-nice-quotes`.
- No intervenir en Calendario, ABNEROS, otras apps, proveedores o cuentas.
- No habilitar recursos de pago, dependencias importantes ni nuevos servicios sin autorización.

## Regla operativa con Fer & Noa · 15/11/2026

- **Fer & Noa dan la instrucción; el asistente implementa de principio a fin.** Nunca devolver tareas técnicas para que copien, peguen, editen, ejecuten comandos o publiquen. No ofrecer «código listo para copiar» como sustituto de una ejecución autorizada.
- **Publicación exclusivamente en Cloudflare Workers** mediante el flujo conectado del proyecto; GitHub es únicamente la fuente de código y se puede actualizar mediante su API, sin usar **GitHub Actions** ni consumir minutos de sus runners. No crear flujos de GitHub Actions, Workers nuevos ni servicios de pago.
- Para cada cambio: modificar solo lo solicitado, probar, confirmar en los logs de Cloudflare el build correcto y comprobar el deployment de la nueva versión al 100 %. Si no se puede completar un paso, informar exactamente qué faltó, sin pedir al usuario trabajo manual.
- **Eliminar significa eliminar**, no esconder con CSS o mantener lógica duplicada. Preservar diseños, dimensiones y efectos aprobados cuando el usuario no pida cambiarlos.

## Navegación nativa de Android · 15/11/2026

- Un controlador común de historial para Inicio, Cotizaciones, Diseñador, Mensajes, cotización activa, pestañas de edición, menú lateral, ayuda de instalación, vista previa de cliente y simulación de móvil.
- Atrás del sistema y «Volver al diseñador» utilizan el historial del navegador/PWA. Al llegar a Inicio no se bloquea la salida normal de Android.
- Cambiar Scroll/Revista 3D no crea pasos redundantes; las ediciones de campos y los filtros no se consideran navegación.
- El historial contiene únicamente IDs y opciones de vista, nunca textos de mensajes, fotografías, precios ni datos privados.
- La comprobación automatizada usa popstate/historial simulado. La validación táctil con el botón físico o gesto de Android sigue pendiente hasta probarla sobre el dispositivo.

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

**Regla única desde 20/11/2026:** trabajar directamente sobre el único `main`. No crear ramas de desarrollo, experimentos, PR de integración, copias paralelas, ramas de respaldo o previews de ramas. Conservar el historial de commits para recuperar cambios si hiciera falta. Antes de actualizar `main`, comprobar el SHA actual; aplicar únicamente un commit de avance lineal y verificar que no hay ramas sobrantes. GitHub es fuente de código, no canal de publicación: validar la versión de Cloudflare por separado. No activar GitHub Actions ni nuevos servicios de build.

## Continuidad

El estado de una tarea siempre distingue cuatro niveles: **código escrito → build probado → versión publicada → interfaz comprobada**. No llamar `100 %` a una etapa que solo ha compilado.

## Puente a HAVANA CALENDARIO · 17/11/2026

Está autorizado exclusivamente el binding privado `CALENDAR_DB` a `havana-events-sync` desde el Worker de HAVANA QUOTES. No usar fetch público, tokens ni GitHub Actions. La identidad del origen queda en `hnq:<quote.id>` y cada revisión reemplaza esa ficha, nunca un evento ajeno. Conserva promociones a Confirmado/Realizado y ediciones manuales, con retry al recuperar D1. Verificar en el build de Cloudflare que `DB`, `CALENDAR_DB` y `MEDIA` siguen correctamente vinculados y que la otra PWA mantiene su D1/R2 original.
