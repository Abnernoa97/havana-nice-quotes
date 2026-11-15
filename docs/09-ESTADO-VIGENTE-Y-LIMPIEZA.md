# 09 · Estado vigente — HAVANA NICE Quotes Studio (QN-00.09)

**Última revisión técnica:** 15/11/2026. Este documento + [Issue #3 · Plan Nivel Dios](https://github.com/Abnernoa97/havana-nice-quotes/issues/3) son la fuente actual. Los documentos 01–08 incluyen historial y pueden describir versiones anteriores. **Nunca llamar «100 % terminado» a algo que no pasó su comprobación.**

## Naturaleza y alcance

**Es un prototipo visual con datos totalmente ficticios.** Parejas, cotizaciones, presupuestos y mensajes de ejemplo NO son clientes reales. No hay backend, inicio de sesión, firma legal, envíos reales, pagos, facturación ni sincronización entre dispositivos. **No introducir datos comerciales reales** hasta crear protección, privacidad, respaldo y autenticación. No exigir un respaldo JSON de estos ejemplos para avanzar: la exportación ficticia se eliminó.

La aplicación permite navegar por Inicio, Cotizaciones, Editor y Mensajes; editar nombres, fechas, texto, estilo, fotografía, color, inversión y anticipo; consultar una vista Scroll y una **revista 3D de seis hojas fijas**. Los mensajes y la aceptación son simulaciones, marcados como tales. Todavía **no** existe un editor libre de páginas ni bloques.

## Fuente del código, publicación y punto de recuperación

- **GitHub único:** `Abnernoa97/havana-nice-quotes`; `main` es la rama de producción y única rama **permanente prevista**.
- **Último commit de aplicación verificado:** `38c71ab94a78a553214f6db34e9ccab0a7ef57ca`. La actualización de ESTE documento generará un nuevo SHA de `main` **sin modificar el código de la app**.
- **Cloudflare:** cuenta **Solo Aplicaciones**, Worker `havana-nice-quotes`, https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Publicación verificada del código de referencia:** Workers Build `87cacb0c-48b8-4b06-bb1a-517237f52167` **SUCCESS**; deployment `e9b030bc-74ba-4e00-9a80-1c40452f4a39`, versión `5b7e2163-5962-4aff-9a53-c03fce97dc06`, 100 % del tráfico. Para el estado *en vivo* posterior a este documento, consultar siempre Cloudflare.
- **Rama temporal:** `work/qn-00-07-modularizacion`, con el mismo contenido que `main` al cierre del ciclo de código. Su Preview tiene `auto_build=false`. La rama y Preview **NO han sido eliminados**: el conector GitHub conectado no puede borrar ramas. Se conservan hasta cerrar la comprobación visual y disponer de una operación con permisos.
- **Rollback técnico previo al refactor:** commit `79dbca9709bfdac3129692e31f250f6c5a6f7b78`; deployment `8f6388f3-35dc-4d8c-8008-a654c72476a8`; versión `bc20ca88-bbdd-4fee-9aa5-f6787121f8b7`. **No borrar el historial** de Git ni versiones de Workers.
- **Dependencias:** `bun.lock` versionado; Cloudflare usa Bun 1.4.4 y Node 24.22.1 en sus builds verificados. Sin infraestructuras nuevas ni servicios facturables.

## Árbol de código en uso

```text
src/
  main.tsx                          # entrada PWA
  app/
    App.tsx                         # 279 líneas, navegación y composición
    WorkspaceChrome.tsx             # barra, menú, navegación
  features/
    home/
      HomeScreen.tsx                # fecha y saludo locales, actividad demo basada en cotizaciones
      greeting.ts
    quotes/
      types.ts                      # Quote, QuoteStatus, QuoteStyle, ReadingMode
      demo-data.ts                  # muestras ficticias
      model.ts                      # búsquedas, estado, alta, edición, validación de importes
      storage.ts                    # parser de guardado local, validación, IDs únicos
      useQuoteStore.ts              # hook de persistencia local
      QuotesScreen.tsx
    messages/MessagesScreen.tsx     # chat demo, borradores aislados por pareja
    editor/
      QuoteEditorScreen.tsx
      QuoteDetailsPanel.tsx
      QuoteDesignPanel.tsx
      QuotePricingPanel.tsx
      styles/EditorialStyles.tsx
      styles/editorial-styles.css
    client/
      Proposal.tsx                  # previsualización Scroll
      ClientPage.tsx                # acciones demo de cliente
    magazine/
      FlipMagazine.tsx              # motor Page Flip con seis hojas fijas
      flip-magazine.css             # proteger pliegue/sombras
    pwa/
      useInstallPrompt.ts
      InstallGuide.tsx
  shared/
    lib/formatters.ts               # único formateador USD
    styles/index.css                # CSS base y responsive
  types/page-flip.d.ts
tests/
  quotes-model.test.mjs
  accessibility-source.test.mjs
scripts/project-audit.mjs
bun.lock
```

## Qué está técnicamente demostrado

- **23/23 pruebas automáticas**, auditoría de estructura, TypeScript estricto y Vite pasaron en Preview; el mismo commit de app compiló y se publicó correctamente en producción.
- Tests: importes USD, fechas, estados, búsqueda, crear/editar, anticipos 0–100 %, los cinco estilos y lectura Flip/Scroll serializados, rechazo de datos locales incompletos o duplicados, borradores separados por pareja, elección de la primera cotización local al recargar y aceptación simulada por cotización.
- Sin `@ts-nocheck` en `src/`; TypeScript tiene `noUnusedLocals` y `noUnusedParameters`. Imports antiguos, funciones duplicadas y el formateador USD repetido fueron depurados; `App.tsx` pasó de 1,002 a 279 líneas. Un botón `Filtrar` inactivo y la exportación JSON innecesaria se retiraron.
- CSS base: **1,792 líneas** después de eliminar 39 líneas obsoletas; Editorial **101** y Page Flip **82**. Se inspeccionaron reglas por media query y no se identificaron bloques repetidos equivalentes en el mismo contexto; clases dinámicas se preservaron. **No confundir este examen del código con aprobación visual de la cascada.**
- **Motor 3D no rediseñado:** preservar `flippingTime: 1080`, `maxShadowOpacity: 0.72`, `showCover: false`, `usePortrait: true`, `loadFromHTML`. La base CSS del Page Flip no se modificó durante la limpieza.
- Clave local `hn_quotes_visual_v1` preservada; fotos y registros ficticios válidos permanecen, sin migración destructiva. Los botones y envíos demo no están conectados con terceros.

## Lo que sigue PENDIENTE, sin exageraciones

1. **Samsung/PWA real:** Inicio, barra inferior y atrás, nueva cotización, editar, guardar y reabrir, búsqueda/filtros, fotos, cinco estilos, inversión, menú y envío demo.
2. **Revista 3D real:** tocar/arrastrar esquinas, hoja anterior/siguiente, sombreado, doblez, primer/último folio, modo móvil y regreso al editor. **No darlo por probado con tests unitarios.**
3. **Desktop y móvil:** responsive en varias anchuras, accesibilidad interactiva, consola, recarga, imágenes y caché del Service Worker. No eliminar ni reorganizar CSS adicional sin comparaciones visuales.
4. **Cerrar rama temporal y su preview** cuando termine QA y GitHub permita eliminación. Historial Git y versiones de Cloudflare se conservan.
5. **Siguiente fase del producto (NO iniciada):** diseño del modelo de páginas y bloques, añadir, duplicar, reordenar, eliminar y editar, vinculado a lectura Scroll/Flip; sin romper el motor 3D.

El checklist vivo es **[Issue #3 · QN-00.09](https://github.com/Abnernoa97/havana-nice-quotes/issues/3)**. Estado de ese checklist al actualizar este archivo: **23/37** pasos comprobados; el número puede variar en el issue, que es la fuente de verdad.

## Protocolo para seguir desde otro chat sin contexto

1. Leer este archivo y el [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3) **antes** de editar.
2. Consultar el `main` de GitHub y el despliegue actual **por separado**, no confiar en un SHA histórico.
3. Un cambio lógico por commit; probar en Preview si afecta la aplicación; revisar logs, test unitarios, TypeScript y build completo antes de mover `main`.
4. Usar **solo** este repositorio y el Worker de Solo Aplicaciones. No tocar otros proyectos, ni crear servicios de pago. Preview mantiene `auto_build=false` para ahorrar builds.
5. No introducir datos reales, no borrar almacenamiento del móvil y no tocar pliegue 3D, CSS o PWA sin pruebas adecuadas.
6. Documentar siempre **código / build / deployment / validación visual** como cuatro estados diferentes. No marcar tareas pendientes por deducción.
