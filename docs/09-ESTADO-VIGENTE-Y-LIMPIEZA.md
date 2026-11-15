## Diseñador reorganizado · 15/11/2026

Datos incluye precio/moneda/anticipo sin duplicación; Estilos tiene dos acordeones sin explicaciones; Diseño conserva edición visual; Publicar contiene la vista real Scroll/3D con acciones de envío pendientes. Los borradores nuevos arrancan sin contenido ficticio. El código obsoleto de previsualización lateral fue eliminado; historial de Android preservado y mapeo de pestaña anterior Precios hacia Datos.

# 09 · Estado vigente y limpieza

**Actualizado 15/11/2026 · Cambio de prototipo local a sincronización privada cloud.**

- Repo `Abnernoa97/havana-nice-quotes`, rama única `main`; publicación automática en el Worker Cloudflare existente `havana-nice-quotes`.
- React + Vite, editor/Inicio/Cotizaciones/Mensajes/Vista cliente, lectura Scroll y PageFlip 3D conservados.
- Primera plantilla real de Canva: **HAVANA NICE Original · Carolina**, 3 páginas, 6 espacios de fotografía independientes desde R2 privado, textos de servicio/producción editables. Predeterminada en borradores nuevos; estilos editoriales antiguos preservados.
- Navegación nativa de Android/PWA mediante historial centralizado. La prueba táctil sigue pendiente.
- **Nube:** D1 `havana-nice-quotes-sync` con tablas `quotes`, `media` (con campo `deleted_at`), `device_invites` y `device_sessions`; R2 `havana-nice-v2-media` usando únicamente `quotes-studio/photos/`. Ningún dato del calendario o Book v2 se borra.
- Cuenta de cotizaciones y fotos de Quotes Studio inicia **en cero**; el storage local antiguo ya no alimenta la app.
- **Acceso sin contraseña:** vinculación mediante un enlace privado único por teléfono; token hasheado y consumible una sola vez en D1, cookie HttpOnly/Secure/SameSite=Strict propia de cada dispositivo, autorización renovable sin formulario de contraseña. Cloudflare Access no está habilitado; no se utiliza.
- Cotizaciones por ID y revisión, guardado automático, consulta cada 15 segundos y aviso al detectar conflicto o caída de conexión. No repetir escrituras cada segundo durante una caída de red.
- Sin imágenes de stock ni Unsplash en la versión de producción: los borradores empiezan con portada vacía, y los espacios sin imágenes usan la paleta HAVANA NICE sin perder dimensiones ni animaciones.
- Galería de fotos sin textos por imagen, visor fullscreen, selección prolongada y envío a Papelera recuperable. El borrado definitivo solo se ejecuta desde la propia Papelera con confirmación.
- Fotos privadas desde R2; **exclusivamente las subidas manualmente a Quotes Studio** desde Fotos o Diseño, visibles para portada y sincronización en todos los teléfonos. No se consulta, lista ni muestra contenido de otras aplicaciones, aunque se reutilice el mismo bucket R2. El tamaño usado y el conteo solo abarcan la biblioteca propia.
- Publicación y QA deben verificarse por separado: code, auditoría, tests, TypeScript, Workers Build exitoso, deployment 100% y pruebas manuales móviles. **Ningún deploy por GitHub Actions**.
- **No implementado:** compartir links privados con clientes, aceptación contractual, mensajes reales, avisos de recepción y editor de páginas libres.
- No se toca el motor de plegado 3D ni se alteran sus parámetros.

## Principios operativos

Fer & Noa indican cambios; el asistente modifica, comprueba y publica sin exigir tareas técnicas manuales. Eliminar implica quitar código y conexiones muertas, no ocultarlas. Una sola implementación vigente, sin ramas adicionales ni recursos de pago innecesarios.

## Fuentes activas
- [Visión](03-VISION-DEL-PRODUCTO.md)
- [Roadmap](04-ROADMAP.md)
- [Protocolo](05-PROTOCOLO-DE-DESARROLLO.md)
- [Decisiones](06-DECISIONES.md)
- [Plan de control y QA](https://github.com/Abnernoa97/havana-nice-quotes/issues/3)
