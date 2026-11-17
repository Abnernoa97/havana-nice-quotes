### Puente HAVANA CALENDARIO · 17/11/2026

- Integración servidor-servidor desde HAVANA QUOTES al D1 existente `havana-events-sync`, por binding privado `CALENDAR_DB`.
- Se crean o actualizan cotizaciones con fecha y nombre completos y se reconcilian cambios y papelera sin duplicados; las plantillas no aparecen como cotizaciones.
- No se interviene en bases de datos, galería R2 o registros previos de Calendario salvo las fichas de origen `havana-quotes` con ID determinista.
- El aviso correspondiente y conciliación de cola offline están en HAVANA CALENDARIO. Validación en D1 real pendiente hasta la primera propuesta completa; simulaciones automatizadas cubren idempotencia, estados, fechas y edición manual.

# ESTADO VIGENTE · 17/11/2026

El plan maestro principal es [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). Las notas históricas posteriores a este encabezado pueden mencionar fases ya implementadas.

**Completado en código:** D1 y R2 privados; cotizaciones con sincronización, biblioteca de fotos/videos y miniaturas; diseñador universal de foto/texto/capas; portada video, Scroll y Revista 3D; un solo `designLayout`; selector de anticipo 20–100 en flujo; pasos Estilos → Datos → Diseño → Publicar; cuatro composiciones editoriales propias (Vogue, Lane, Junebug, NYT como referencias de estilo); plantillas personales guardadas como registros D1 y clonación de cotizaciones existentes sin modificar la fuente.

**Pendiente todavía en el Plan Maestro:**
1. Gestor de **páginas nuevas arbitrarias**: crear, duplicar, reordenar y eliminar folios más allá de las tres hojas originales; el soporte actual cambia el orden/visibilidad de esas hojas y añade fotos y textos libres en ellas.
2. Deshacer, rehacer, versiones e historial de edición persistente.
3. QA táctil real Samsung/iPhone, scroll, recorte, controles, PageFlip, horizontal/vertical, tablet y accesibilidad; las pruebas automáticas no lo sustituyen.
4. Sincronización servidor-servidor opcional con HAVANA CALENDARIO, pendiente en [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3); no se ha tocado la otra app ni sus datos.
5. Enlaces seguros por propuesta, entrega, recepción, mensajes de cliente reales, firma/aceptación y permisos para uso comercial; siguen fuera del prototipo.

**Plantillas propias · primera versión:** crean una cotización marcada internamente `isTemplate`, con nombre `templateName`; usa el mismo diseñador y se sincroniza en la misma D1, sin abrir tablas ni Workers adicionales. Se puede editar y clonar como nueva cotización. Las plantillas personales heredan todavía las tres hojas estructurales; las páginas verdaderamente libres quedan pendientes del futuro motor de documento.

---

## Plantillas reales (etapa activa)

Incorporada primera cotización real Canva **Carolina**: portada, collage editable y página de experiencia/producción. Siguiente etapa: comparar visualmente con el PDF en Android, afinar tipografía y espaciados, y repetir con los siguientes PDF.

# 04 · Roadmap vigente

**Alcance:** HAVANA NICE Quotes Studio, prototipo con datos ficticios. El control de limpieza está en [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3) y el estado real en [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md). Este documento describe **desarrollo futuro**, no tareas ya entregadas.

## Fase activa: nube privada y banco de fotos · 15/11/2026

**Decisión nueva:** antes de continuar con el editor libre, permitir trabajar en todos los teléfonos con la misma información.

- D1 propio para las cotizaciones (cero datos de prueba iniciales), versión por propuesta y autosave protegido contra escrituras obsoletas.
- R2 existente `havana-nice-v2-media` para la biblioteca privada de Quotes Studio, sin modificar recursos de Book v2 o Calendario.
- Acceso privado sin contraseña mediante vinculación temporal del teléfono, cookies seguras y API interna; fotos por URL autenticada.
- Navegación "Fotos", selección de portada desde el banco y métricas del tamaño de los archivos propios.
- Sin importar muestras locales antiguas, sin enviar correos reales ni recopilar aperturas/ubicaciones.
- **Pendiente de QA manual:** subir/seleccionar una foto desde Samsung, iniciar sesión desde otro teléfono, comprobar que una cotización nueva aparece y que el botón Atrás funciona.

## Prioridad vigente · Diseño completo antes del envío (15/11/2026)

**Decisión de Fer & Noa:** terminar la presentación del diseñador y la experiencia que verá la pareja, en móvil y escritorio, antes de invertir tiempo en envío, avisos, ubicación o seguimiento.

1. Un solo documento editorial para edición en vivo y lectura Scroll del cliente. La primera mejora se publicó en `fb76f9c`. La revista 3D mantiene su motor de hojas independiente.
2. Completar los controles de composición visual, personalización de cada página y consistencia de los cinco estilos; no prometer editor libre mientras las hojas sigan siendo fijas.
3. Probar de forma visual la creación, edición, vista de cliente, portada, scroll y revista en Samsung y escritorio; corregir únicamente defectos reales.
4. **Posteriormente:** enlaces privados para clientes, avisos de apertura y notificaciones. La apertura del enlace no demuestra por sí sola que el destinatario recibió un mensaje. La ubicación precisa no se recopilará sin necesidad y consentimiento expreso.

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
