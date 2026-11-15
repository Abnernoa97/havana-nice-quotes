# 09 · Estado vigente · HAVANA NICE Quotes Studio

**Actualizado:** 15/11/2026. **Punto de entrada vigente** junto a [Issue #3, plan Nivel Dios](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). Para el SHA actual consultar GitHub `main`; para el runtime consultar **Cloudflare**. El HEAD cambia también por cambios solo documentales.

## Lo que realmente existe

**Prototipo visual con datos totalmente ficticios**, no aplicación comercial. No hay autenticación, backend, envío de propuestas reales, mensajes reales, contratos, firma, pagos, datos privados ni sincronización entre teléfonos. No ingresar clientes reales todavía.

Secciones: Inicio, Cotizaciones, Editor (Datos, Estilos, Diseño, Precios), Mensajes simulados y Vista cliente. Cinco estilos internos. Vista Scroll y **revista 3D de seis hojas fijas**. Los mensajes, presupuestos y aceptaciones actuales son muestras.

La app persiste ejemplos localmente en `hn_quotes_visual_v1`. El botón de respaldo JSON de ejemplos y el botón `Filtrar` inerte se eliminaron; búsqueda y filtros de estado funcionan en la demo.

## GitHub, Cloudflare y estado verificado

- **Único repo:** `Abnernoa97/havana-nice-quotes`; **única rama: `main`**. Confirmado en GitHub API el 15/11/2026. Sin PRs abiertos. La rama temporal de QA y su Preview fueron **eliminados**; Git conserva la historia.
- **Único Worker:** Cloudflare **Solo Aplicaciones**, `havana-nice-quotes`, https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Último commit de aplicación verificado:** `38c71ab94a78a553214f6db34e9ccab0a7ef57ca`, Workers Build `87cacb0c-48b8-4b06-bb1a-517237f52167` **success**, versión `5b7e2163-5962-4aff-9a53-c03fce97dc06` al 100 %. Tras la actualización del documento `bffc4b3e2a9638b0a9cbc3e19d8012ef99374fac` (**solo docs**) el deploy fue **success**, versión `ddf4af77-a28d-4881-a592-a0459fdc8bb7` al 100 %; el código de la aplicación no cambió.
- **23/23 tests, TypeScript strict, auditoría estructural y Vite** correctos para ese código. Tests y compilación **no equivalen** a prueba visual/táctil en Samsung.
- **Último rollback técnico pre-refactor:** commit `79dbca9709bfdac3129692e31f250f6c5a6f7b78`; deployment `8f6388f3-35dc-4d8c-8008-a654c72476a8`. No borrar historial ni versiones Cloudflare.
- Lockfile `bun.lock` versionado y verificado en builds Cloudflare; sin recursos de pago adicionales.

## Estructura activa (no versiones paralelas)

```text
src/
  main.tsx
  app/
    App.tsx                    # 279 líneas, composición y navegación
    WorkspaceChrome.tsx        # interfaz general y menú
  features/
    home/                      # Inicio, fecha y actividad demo
    quotes/                    # Quote, muestras, estado, búsquedas y almacenamiento local
    editor/                    # cuatro apartados de edición + estilos editoriales
      styles/
    client/                    # Proposal (embebida) y ClientPage (Scroll)
    magazine/                  # FlipMagazine + CSS del pliegue
    messages/                  # chat ficticio
    pwa/                       # instalación
  shared/
    lib/formatters.ts          # único USD / fechas
    styles/index.css           # estilos base/responsive
  types/page-flip.d.ts
tests/
  quotes-model.test.mjs
  accessibility-source.test.mjs
scripts/project-audit.mjs
bun.lock
```

`App.tsx` pasó de aproximadamente 1.002 a **279 líneas**; no quedan `@ts-nocheck` en `src/`. No hay carpetas activas `old/v2`, ramas paralelas ni formateador USD duplicado. El CSS general contiene aproximadamente **1.792 líneas**, además del CSS editorial y de revista: **no reorganizarlo por una simple coincidencia de nombres**; su cascada depende de breakpoints y clases dinámicas.

## Qué falta de verdad

- **Samsung/desktop, pendiente de pruebas reales:** navegación, atrás, crear y editar, guardar/recargar, filtros, fotos, fuentes, estilos, precio, anticipo, envío/mensajes demo, caché PWA y accesibilidad.
- **Revista 3D, pendiente visual:** arrastre, sombras, esquinas, primera/última hoja, mobile y regreso a editor. Conservar pliegue y parámetros `flippingTime: 1080`, `maxShadowOpacity: 0.72`, `showCover: false`, `usePortrait: true`, `loadFromHTML`.
- **Fase 1 aún no iniciada:** modelo de páginas y bloques, crear/duplicar/ordenar/eliminar, y reflejarlo en Scroll/Flip.
- **Rendimiento, velocidad y microdetalles del doblez:** expresamente **pospuestos por el propietario**; no mezclar con la limpieza.
- Validación visual pendiente significa que no puede afirmarse que el diseño es «100 % idéntico» solo por la compilación.

## Reglas para continuar desde cualquier otro chat

1. Leer `README.md`, este documento e [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). Luego la [visión](03-VISION-DEL-PRODUCTO.md), [roadmap](04-ROADMAP.md), [protocolo](05-PROTOCOLO-DE-DESARROLLO.md) y [decisiones](06-DECISIONES.md) según necesidad.
2. Verificar GitHub `main` y Cloudflare **por separado** antes de un cambio.
3. No crear servicios ni bases de datos, no introducir clientes reales, no cambiar caché/datos o PWA sin revisión.
4. Conservar el diseño y Page Flip; no reestructurar CSS/animación sin pruebas visuales Samsung/escritorio.
5. Un commit por cambio lógico, verificaciones reproducibles y publicación confirmada. Registrar **código / build / deploy / prueba visual** por separado.
6. Historial antiguo recuperable en [Índice histórico](HISTORIAL.md). No tomar instrucciones anteriores como estado vigente.
