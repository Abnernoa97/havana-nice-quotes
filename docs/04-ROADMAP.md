# 04 · Roadmap vigente

**Alcance:** HAVANA NICE Quotes Studio, prototipo con datos ficticios. El control de limpieza está en [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3) y el estado real en [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md). Este documento describe **desarrollo futuro**, no tareas ya entregadas.

## Prioridad vigente · Diseño completo antes del envío (15/11/2026)

**Decisión de Fer & Noa:** terminar la presentación del diseñador y la experiencia que verá la pareja, en móvil y escritorio, antes de invertir tiempo en envío, avisos, ubicación o seguimiento.

1. Un solo documento editorial para edición en vivo y lectura Scroll del cliente. La primera mejora se publicó en `fb76f9c`. La revista 3D mantiene su motor de hojas independiente.
2. Completar los controles de composición visual, personalización de cada página y consistencia de los cinco estilos; no prometer editor libre mientras las hojas sigan siendo fijas.
3. Probar de forma visual la creación, edición, vista de cliente, portada, scroll y revista en Samsung y escritorio; corregir únicamente defectos reales.
4. **Posteriormente:** backend privado, envío por enlace, saber si el enlace se abrió y notificaciones. La apertura del enlace no demuestra por sí sola que el destinatario recibió un mensaje. La ubicación precisa no se recopilará sin necesidad y consentimiento expreso.

**Estado:** mejoras de interfaz en curso; publicación visual y compilación no equivalen a aprobación manual en dispositivos. Los envíos y eventos reales no están implementados.

## Etapa actual · Cierre de limpieza

**Confirmado:** separación de pantallas por funcionalidad, una sola rama `main`, lockfile reproducible, TypeScript estricto, un único formateador USD, estados y datos demo validados, 23 pruebas automatizadas, build publicado. Instrucciones obsoletas retiradas de la documentación activa.

**Aún sin comprobar manualmente:** Samsung instalado, navegación y recarga, selección/carga de fotos, fuentes y cinco estilos, modos Scroll/Flip, doblez y reverso, responsividad, caché PWA, accesibilidad real y consola del navegador.

**Decisión de alcance:** NO retocar CSS activo, curva, sombras, velocidad o animaciones 3D durante la limpieza documental/técnica. Esas mejoras se harán en una fase posterior con capturas y pruebas visuales comparables.

**Criterio de cierre:** evidencia de pruebas visuales y táctiles, no solo `npm run build`. Si no hay acceso al Samsung, mantener abierto el pendiente sin bloquear indefinidamente el diseño del siguiente módulo.

## Fase 1 · Documento y páginas editables (próxima funcionalidad)

1. Definir un esquema versionado de documento, páginas, bloques y orden, compatible con las cotizaciones de ejemplo.
2. Añadir, duplicar, reordenar y eliminar páginas desde un gestor claro para el Samsung.
3. Renderizar las páginas desde ese único esquema en editor, Scroll y Page Flip 3D.
4. Verificar guardado local, recuperación, cambio de estilo y sin regresiones en navegación o pliegue.

**Terminado cuando:** una página creada aparece en Vista cliente y permanece después de recargar. **Todavía no implementado.**

## Fase 2 · Editor libre profesional

Bloques de texto e imagen; arrastrar, colocar, dimensionar, recortar, alinear y ordenar capas; deshacer/rehacer; vistas móvil/escritorio. Sin convertir la interfaz en un panel complejo. **No implementado.**

## Fase 3 · Estilos editoriales propios

Revisar las referencias internas de Vogue, The Lane, Junebug Weddings y The New York Times, además de Libre. Crear composiciones originales, editables y legalmente utilizables; jamás simular marcas o páginas oficiales. Confirmar nombres dudosos antes de ampliar. **No implementado como editor de composiciones.**

## Fase 4 · Lectura y rendimiento avanzados

Refinar velocidad, doblez, sombras, reverso, esquinas, accesibilidad y transiciones por página/sección. Comparar en Samsung y desktop antes/después. **Pospuesto expresamente: no mezclar con limpieza.**

## Fase 5 · Producto privado y comercial (solo con aprobación)

Autenticación, roles, base de datos, almacenamiento privado de fotos, sincronización y copias de seguridad; enlaces individuales, mensajería real, contratos y firma/aceptación verificable. Evaluar costos y seguridad antes de contratar o configurar servicios.

## Regla de ejecución

Un objetivo por cambio; evitar ramas permanentes, archivos `old/v2/final`, código experimental abandonado y CSS duplicado. Conservar el historial Git como mecanismo de recuperación; no almacenar respaldos de ejemplo dentro de `src/`.
