## Diseñador reorganizado · 15/11/2026

Datos incluye precio/moneda/anticipo sin duplicación; Estilos tiene dos acordeones sin explicaciones; Diseño conserva edición visual; Publicar contiene la vista real Scroll/3D con acciones de envío pendientes. Los borradores nuevos arrancan sin contenido ficticio. El código obsoleto de previsualización lateral fue eliminado; historial de Android preservado y mapeo de pestaña anterior Precios hacia Datos.

# 09 · Estado vigente y limpieza

**Actualizado 16/11/2026 · Editor modular y sincronización privada cloud.**

- Repo `Abnernoa97/havana-nice-quotes`, rama única `main`; publicación automática en el Worker Cloudflare existente `havana-nice-quotes`.
- React + Vite, editor/Inicio/Cotizaciones/Mensajes/Vista cliente, lectura Scroll y PageFlip 3D conservados.
- Primera plantilla real de Canva: **HAVANA NICE Original · Carolina**, 3 páginas, 6 espacios de fotografía independientes desde R2 privado, textos de servicio/producción editables. Predeterminada en borradores nuevos; estilos editoriales antiguos preservados.
- Navegación nativa de Android/PWA mediante historial centralizado. La prueba táctil sigue pendiente.
- **Nube:** D1 `havana-nice-quotes-sync` con tablas `quotes`, `media` (con campo `deleted_at`), `device_invites` y `device_sessions`; R2 `havana-nice-v2-media` con `quotes-studio/photos/`, `quotes-studio/videos/`, `quotes-studio/photo-thumbnails/` y `quotes-studio/video-posters/`. Ningún dato del calendario o Book v2 se borra.
- Los borradores nuevos empiezan sin material ficticio; las fotos y videos reales guardados en D1/R2 se conservan. El almacenamiento local antiguo ya no alimenta la app.
- **Acceso sin contraseña:** vinculación mediante un enlace privado único por teléfono; token hasheado y consumible una sola vez en D1, cookie HttpOnly/Secure/SameSite=Strict propia de cada dispositivo, autorización renovable sin formulario de contraseña. Cloudflare Access no está habilitado; no se utiliza.
- Cotizaciones por ID y revisión, guardado automático, consulta cada 15 segundos y aviso al detectar conflicto o caída de conexión. No repetir escrituras cada segundo durante una caída de red.
- Sin imágenes de stock ni Unsplash en la versión de producción: los borradores empiezan con portada vacía, y los espacios sin imágenes usan la paleta HAVANA NICE sin perder dimensiones ni animaciones.
- Galerías de fotos y videos con miniaturas JPEG 480×360, sin nombres ni reproductores por tarjeta; visor fullscreen, selección prolongada y envío a Papelera recuperable. El video de portada se reproduce silenciado, automáticamente y en bucle en Diseño/Scroll/3D; el archivo real conserva su audio. El borrado definitivo solo se ejecuta desde la propia Papelera con confirmación.
- Fotos privadas desde R2; **exclusivamente las subidas manualmente a Quotes Studio** desde Fotos o Diseño, visibles para portada y sincronización en todos los teléfonos. No se consulta, lista ni muestra contenido de otras aplicaciones, aunque se reutilice el mismo bucket R2. El tamaño usado y el conteo solo abarcan la biblioteca propia.
- Publicación y QA deben verificarse por separado: code, auditoría, tests, TypeScript, Workers Build exitoso, deployment 100% y pruebas manuales móviles. **Ningún deploy por GitHub Actions**.
- **No implementado:** compartir links privados con clientes, aceptación contractual, mensajes reales, avisos de recepción y editor de páginas libres.
- No se toca el motor de plegado 3D ni se alteran sus parámetros.

## Principios operativos

Fer & Noa indican cambios; el asistente modifica, comprueba y publica sin exigir tareas técnicas manuales. Eliminar implica quitar código y conexiones muertas, no ocultarlas. Una sola implementación vigente, sin ramas adicionales ni recursos de pago innecesarios.

## Arquitectura del editor

La estructura vigente de Fotos, Textos, Lienzo y módulos compartidos está en [Arquitectura del editor](10-ARQUITECTURA-EDITOR.md). No se mantienen archivos duplicados de editores antiguos. Las plantillas y el modelo compartido siguen sirviendo al diseñador, Scroll y 3D.

## Fuentes activas
- [Visión](03-VISION-DEL-PRODUCTO.md)
- [Roadmap](04-ROADMAP.md)
- [Protocolo](05-PROTOCOLO-DE-DESARROLLO.md)
- [Decisiones](06-DECISIONES.md)
- [Plan de control y QA](https://github.com/Abnernoa97/havana-nice-quotes/issues/3)

## Compatibilidad y limpieza · noviembre 2026

Se eliminó la interfaz de reproductor por tarjeta, el panel de estadísticas duplicado en Fotos y los formateadores de tamaño no utilizados. **Eliminados completamente el campo y el adaptador de lectura heredado `carolinaLayout`: toda edición y render usan únicamente `designLayout`.** Las cotizaciones de prueba que dependían del campo antiguo pueden perder su distribución; no se eliminaron registros ni medios del servidor.

## 17/11/2026 · Estilos, plantillas y reutilización

- La pestaña inicial es **Estilos**, seguida de Datos, Diseño y Publicar.
- El anticipo despliega sus nueve opciones dentro del flujo de la página; no queda cortado por `overflow:hidden` de la tarjeta ni por la navegación inferior.
- `src/features/editor/styles/EditorialStyles.tsx`: originales y referencias editoriales con botón «Crear plantilla», selector «Utilizar cotización existente» y apartado «Mis plantillas».
- `src/features/quotes/model.ts`: duplicación profunda con UUID nuevo, dejando la cotización original intacta. Para utilizar plantilla propia se limpian datos personales e importes y se conserva el diseño.
- `Quote.isTemplate` y `Quote.templateName` usan la **misma D1 privada**; se excluyen las plantillas de las cotizaciones, estadísticas y conversaciones, no se crea otra base de datos.
- `src/features/templates/editorial-template.css` desarrolla cuatro composiciones **originales** con tipografía, posición de portada, collage y jerarquía de términos diferentes; nombres de publicaciones como referencias no oficiales. Editor, Scroll y 3D utilizan los mismos elementos editables.
- **Queda abierto:** crear páginas arbitrarias fuera de las tres páginas actuales, deshacer/rehacer y QA móvil táctil. La creación de plantillas personalizadas reutiliza las hojas actuales, todavía no equivale a un lienzo multipágina ilimitado.

## 17/11/2026 · Puente HAVANA CALENDARIO

Worker Quotes `worker/calendar-bridge.ts` sincroniza solo cotizaciones reales con nombre y fecha válidos usando el segundo binding D1 `CALENDAR_DB` (misma cuenta, sin servicios nuevos). Se preservan IDs y ediciones de Calendario y se reintentan fallos en lecturas autorizadas de Quotes. `tests/calendar-bridge.test.mjs` contiene pruebas sin datos reales. Calendario declara el origen en su app, README y contratos. **El puente no importa borradores sin fecha, ni plantillas.**
