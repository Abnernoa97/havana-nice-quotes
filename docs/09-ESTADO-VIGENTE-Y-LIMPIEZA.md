# 09 · Estado vigente — Arquitectura preparada (QN-00.09)

**Verificado:** 15/11/2026. **Fuente principal del proyecto junto al [Plan Nivel Dios #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3).** No confundir el código compilado, el despliegue publicado y la prueba visual del Samsung.

## Qué existe hoy

HAVANA NICE Quotes Studio es **un prototipo visual con cotizaciones, parejas, fechas, importes y conversaciones TOTALMENTE FICTICIOS**. El propietario lo confirmó el 15/11/2026. No hay datos reales que respaldar ni es requisito descargar JSON del Samsung para continuar. La herramienta opcional de exportación es parte de la demo. No hay backend, cuentas, autenticación, contratos, envío comercial, firma ni cobros reales.

- **GitHub:** `Abnernoa97/havana-nice-quotes`, **`main` es única rama permanente prevista**. Puede existir una rama temporal de QA hasta eliminarla; no representa una segunda aplicación.
- **Cloudflare:** cuenta Solo Aplicaciones, Worker `havana-nice-quotes`, URL https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Producción y recuperación:** consultar el SHA de `main` y el último deployment de Cloudflare. Punto anterior al refactor integral: commit `79dbca9709bfdac3129692e31f250f6c5a6f7b78`, deployment `8f6388f3-35dc-4d8c-8008-a654c72476a8`, versión `bc20ca88-bbdd-4fee-9aa5-f6787121f8b7`. No borrar historial.
- **QA aislada:** commit `785f350d313db6b131269f69aac509c372f8fb9a`, Workers Build `5ce38568-fd4c-4c19-a9f8-303fe09d13aa`, **SUCCESS**, en la rama temporal con `auto_build=false`. `npm run build` ejecutó auditoría, **4 pruebas automáticas**, TypeScript con detección de código sin uso y Vite (**1,601 módulos**). Preview independiente https://work-qn-00-07-modularizacion-havana-nice-quotes.soloaplicaciones97.workers.dev
- **Lockfile real:** `bun.lock` copiado sin fabricar contenido desde un Workers Build de Preview verificado. Se conserva la misma familia de dependencias; sin paquetes nuevos para tests.

## Arquitectura actual del código

```text
src/
  main.tsx                                 # entrada React/PWA
  app/
    App.tsx                                # ~334 líneas, composición y estado
    WorkspaceChrome.tsx                    # menú, identidad, topbar
  features/
    home/HomeScreen.tsx                    # Inicio
    quotes/
      types.ts                             # contrato tipado de cotización ficticia
      demo-data.ts                         # tres ejemplos
      model.ts                             # filtrado y estado
      QuotesScreen.tsx                     # lista / búsqueda
    editor/
      QuoteEditorScreen.tsx                # diseñador, vista en vivo
      QuoteDetailsPanel.tsx
      QuoteDesignPanel.tsx
      QuotePricingPanel.tsx
      styles/
        EditorialStyles.tsx
        editorial-styles.css
    client/
      Proposal.tsx                         # propuesta embebida
      ClientPage.tsx                       # lectura Scroll
    messages/MessagesScreen.tsx            # bandeja simulada
    magazine/
      FlipMagazine.tsx                     # efecto 3D original
      flip-magazine.css                    # CSS ORIGINAL, no retocado
    pwa/
      useInstallPrompt.ts
      InstallGuide.tsx
  shared/
    lib/formatters.ts                      # único Intl.NumberFormat
    styles/index.css                      # CSS original movido sin cambiarlo
  types/page-flip.d.ts                     # declaración local para TypeScript
scripts/project-audit.mjs                 # integridad, imports, Page Flip
tests/quotes-model.test.mjs              # cuatro tests de filtros, estados, USD, fechas
bun.lock                                   # versiones exactas de Bun
```

## Protecciones que ya están implementadas

- No quedan componentes de raíz `src/App.tsx`, `src/FlipMagazine.tsx`, `src/EditorialStyles.tsx`: sus módulos activos están separados por responsabilidad.
- **Cero `@ts-nocheck` en `src/`**, TypeScript `strict` y comprobación de variables/imports no usados activada.
- Modelo de cotizaciones, estado y paneles tipados. Eliminado el segundo formateador USD y la lógica de filtro duplicada.
- El comando `npm run build` incluye **auditoría de estructura + pruebas automáticas + TypeScript + Vite**. Si falla cualquiera, se detiene la compilación antes del despliegue.
- Se conservó íntegro el CSS y los parámetros del motor Page Flip: `flippingTime: 1080`, `maxShadowOpacity: 0.72`, `showCover: false`, `usePortrait: true`, `loadFromHTML`. El audit los protege.
- Se conservan `hn_quotes_visual_v1`, el arranque PWA, los cuatro apartados, los cinco Estilos, Scroll y Flip y las acciones de demostración. No se introdujeron nuevos servicios de pago, bases de datos ni Workers.

## Lo que NO está terminado

- **Prueba visual/regresión humana en Samsung** de la versión posterior a esta gran reorganización: no se puede sustituir por un build exitoso.
- **Retirar rama de pruebas `work/qn-00-07-modularizacion`** tras integrar. El conector GitHub disponible permite crear/actualizar ramas pero no borrarlas; no afirmar que se eliminó.
- **Auditoría visual CSS:** hay selectores repetidos para distintos breakpoints (1250/950/600 px); no se deben borrar por coincidencia textual. Se preservaron reglas y cascada para evitar regresiones.
- **Funcionalidad real:** el filtro visual decorativo, mensajes, aceptación, envío, firma y paneles son todavía la demo. La fecha fija de Inicio pertenece al diseño de ejemplo. No confundir limpieza técnica con un producto comercial ya construido.
- **Gestor de páginas/editor libre:** pendiente. La revista 3D todavía muestra seis páginas estáticas. El siguiente ciclo de producto definirá páginas y bloques versionados, añadir/duplicar/ordenar/eliminar y vincular Vista cliente.

## Normas para continuar

1. Leer este documento y [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3) antes de desarrollar.
2. Trabajar exclusivamente en este repositorio y Worker. Probar cambios sin crear recursos externos.
3. No publicar intentos: comprobar primero en la rama/Preview, hacer una sola publicación estable en `main` por hito.
4. No alterar la animación 3D aprobada, el CSS ni la clave local sin pruebas específicas.
5. Antes de datos reales, diseñar autenticación, almacenamiento privado, links cliente, permisos y respaldo.

**Resultado previsto de QN-00.09:** base modular y compilada para iniciar el verdadero gestor de páginas. Los límites pendientes se registran sin vender «100% visualmente perfecto» antes de probarlo en Samsung.
