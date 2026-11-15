# 09 · Estado vigente y plan de limpieza (QN-00.09)

**Fecha de verificación:** 15/11/2026. **Este documento prevalece sobre estados históricos de docs/01–08 en caso de contradicción.**

## Identidad y publicación

- **Único proyecto:** `Abnernoa97/havana-nice-quotes` · GitHub (repositorio público).
- **Rama principal:** `main` · commit verificado `4bbeb050c905de02cb1861d824ee2591ba4b9158`.
- **Cloudflare:** cuenta Solo Aplicaciones · Worker `havana-nice-quotes` · https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Build y deploy comprobados:** build `d9075abf-0410-462a-be61-91720db1be90` (success), deployment `08a2f77d-46dd-4360-ad8d-1d7a68b5e66a`, versión `250131a4-8ff9-4a8c-9622-25f92ec7e292`, 100 % del tráfico.
- **Último punto de recuperación anterior:** commit `b830cbd003a352e2569c459bcd92a23ac14c3c45`, deployment `fa9fc125-6372-43f0-8b35-04f9e67dbe0a`, versión `01e23943-33b0-4e58-af72-a2fc4ca68ed9`.

## Qué es y qué NO es

- Prototipo visual React/Vite/PWA. **TODOS los registros actuales son ficticios**. No contiene datos comerciales reales ni contratos.
- Hay Inicio, Cotizaciones, Datos, Estilos, Diseño, Precios, mensajes simulados, vista cliente Scroll y Page Flip 3D. La vista previa modularizada fue revisada por el usuario y Cloudflare la compiló y publicó.
- **Sin** backend, usuarios, roles, sincronización, enlaces privados, envío, firma real, editor libre de bloques ni gestor de páginas. La revista 3D conserva seis hojas fijas.
- La clave de guardado actual es `hn_quotes_visual_v1`; no se requiere obtener JSON del Samsung para seguir limpiando **datos ficticios**. Exportación opcional disponible como demostración.
- **Prohibido introducir datos reales de clientes** hasta implementar privacidad, autenticación y almacenamiento apropiado.

## Carpetas y deuda comprobadas

```text
src/
  main.tsx
  App.tsx                         # composición y estado: 1002 líneas; falta dividir
  index.css                       # 1831 líneas; auditar cascada sin destruir responsive
  EditorialStyles.tsx             # cinco estilos; pendiente mover con su CSS
  editorial-styles.css
  FlipMagazine.tsx                # 6 hojas fijas; proteger efecto aprobado
  flip-magazine.css
  features/editor/
    QuoteDetailsPanel.tsx
    QuoteDesignPanel.tsx
    QuotePricingPanel.tsx
  features/quotes/demo-data.ts    # tres cotizaciones ficticias
  shared/lib/formatters.ts        # moneda y fechas
```

- **Ya hecho y publicado:** datos ficticios, dos formateadores y paneles Datos/Diseño/Precios separados; 11 iconos no utilizados retirados.
- **Falta:** fragmentar App (`Inicio`, `Cotizaciones`, `Mensajes`, `Vista cliente`, navegación); revisión contextual CSS; unificar el segundo formateador USD en FlipMagazine; retirar `@ts-nocheck` de App/FlipMagazine/EditorialStyles en pasos seguros; pruebas automatizadas.
- **Falta lockfile versionado:** no fabricar uno a mano. Generarlo con el gestor real y dependencias comprobadas; los últimos logs de Cloudflare indicaron que no había lockfile para caché de dependencias.
- **No hay carpetas activas duplicadas `old`, `v2`, etc.** Esto no garantiza que todas las funciones o CSS estén libres de duplicaciones.

## Git y Cloudflare: ramas, coste y versiones

- Hay dos ramas Git: `main` y `work/qn-00-07-modularizacion`. Comparación de sus **35 archivos por SHA de blob**: **contenido idéntico**; las historias difieren por el merge tipo *squash*.
- La rama de trabajo puede eliminarse sin perder contenido activo una vez terminado su uso, pero **todavía NO fue eliminada**. La herramienta GitHub de esta sesión no tiene acción de borrar ramas.
- El Preview Cloudflare de la rama tiene `auto_build=false`; `main` conserva el despliegue automático por GitHub. Cada publicación en `main` puede consumir minutos de Workers Builds.
- Conservar versiones y commits históricos para recuperación; **no son código duplicado en producción**.

## Ejecución Nivel Dios — fuente de tareas

El checklist detallado y la evidencia de cada fase están en [**Issue #3 · Plan maestro «Nivel Dios»**](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). No crear un segundo plan paralelo.

1. **A. Higiene:** rama única permanente, actualizar docs, lockfile real, auditoría reproducible.
2. **B. Auditoría:** imports, código muerto, duplicados reales, CSS por breakpoint, lógica demo engañosa.
3. **C. Modularización:** una pantalla/feature por módulo, sin carpetas decorativas ni reescrituras peligrosas.
4. **D. Tipos y pruebas:** retirar gradualmente `@ts-nocheck`, tests básicos, CI/build verificables.
5. **E. Regresión visual:** Samsung y escritorio; Inicio, Cotizaciones, Estilos, Diseño, Precios, Scroll, Page Flip.
6. **F. Cierre:** un único `main` permanente, documentos actualizados, sin deuda crítica conocida; iniciar páginas editables.

**Criterio de calidad:** no basta compilar o tener carpetas bonitas. Cada traslado mantiene comportamiento, responsividad y animación 3D; no se borra CSS por mera repetición de selector. Solo considerar `hecho` lo comprobado.

## Reglas operativas

- Cambiar solo `Abnernoa97/havana-nice-quotes` y Worker Cloudflare Solo Aplicaciones; no tocar Calendario, ABNEROS ni otras aplicaciones.
- Un cambio lógico por commit; comprobación antes/después y publicación por hitos, minimizando Workers Builds.
- **La apariencia, el efecto Page Flip 3D y el almacenamiento local permanecen iguales** durante la limpieza.
- No instalar dependencias ni crear servicios facturables innecesarios. No incluir credenciales.
- **Siguiente función real tras la limpieza:** documento versionado y gestor de páginas crear/duplicar/reordenar/eliminar; enlazar la vista cliente y la revista 3D a esas páginas.

**Historial de ejecución:** [Issue #1 · auditoría y refactor](https://github.com/Abnernoa97/havana-nice-quotes/issues/1) · [PR #2 · módulos integrados](https://github.com/Abnernoa97/havana-nice-quotes/pull/2).
