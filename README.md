# HAVANA NICE · Quotes Studio

**Estudio privado de cotizaciones con sincronización Cloudflare**. Interfaz interna en español y propuestas editoriales para parejas estadounidenses en inglés.

## Acceso y publicación
- **Aplicación:** https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Repositorio:** `Abnernoa97/havana-nice-quotes` (`main`); GitHub solo conserva código. **Build y deployment por Cloudflare Workers Builds, NO GitHub Actions.**
- **Sin contraseña:** cada teléfono se vincula mediante un enlace privado de un solo uso. Una vez vinculado abre la app directamente con una sesión de dispositivo HttpOnly/Secure/SameSite=Strict; sin formulario de contraseña. Desde el estudio se crea un enlace para otro teléfono, válido 20 minutos. **No compartir invitaciones con clientes.**
- **Almacenamiento:** D1 `havana-nice-quotes-sync` guarda cotizaciones por ID y revisión; R2 privado existente `havana-nice-v2-media` guarda fotos, videos web y sus miniaturas JPEG privadas en prefijos separados. No se tocan archivos de Book v2 ni Calendario.
- **Borradores y fotografías:** los borradores nuevos empiezan sin portada de prueba. Se eliminó el archivo de cotizaciones ficticias y todas las referencias a bancos de imágenes de stock en la interfaz y revista; únicamente se usan las fotografías reales subidas desde Fotos o Diseño. No se leen borradores de `localStorage`. Las fotografías existentes subidas por los dueños se conservan.
- **Sincronización:** edición con auto-guardado, lectura cada 15 s y control de versión. Si otro teléfono modifica una cotización concurrentemente, no se sobrescribe en silencio: se muestra una incidencia para resolver. No dar por guardado si la nube está fuera de línea.
- **Biblioteca de videos:** Fotos → Videos convierte localmente a MP4/WebM y guarda la versión web en R2 privado, con metadatos D1, multipart de 6 MiB, Range y Papelera. El + de portada permite escoger foto o video desde la nube. En Diseño, Scroll y Revista 3D el video funciona en bucle, silenciado y sin controles; en el visor de la biblioteca puede escucharse. Fotos y videos disponen de miniaturas JPEG privadas para acelerar las cuadrículas. La primera creación de miniaturas antiguas puede ser más lenta. Pendiente QA táctil móvil; sin transcodificación de pago.
- **Banco de fotografías:** solo material subido manualmente en Quotes Studio; en **Fotos** se seleccionan hasta 10 archivos por lote y en **Diseño** se asigna una foto a cada recuadro desde el teléfono o desde el banco privado de R2. JPG, PNG, WebP, GIF, HEIC/HEIF hasta 12 MB cada una en `quotes-studio/photos/`. Se reutilizan las fotos del banco sin duplicar archivos; otras aplicaciones y sus carpetas no se consultan.
- **Primer acceso:** el enlace inicial se genera una sola vez por Cloudflare desde una autorización administrativa segura. Se utiliza en el navegador o PWA que se desea vincular. El token solo viaja en el fragmento de la URL y se consume al abrirse; no se guarda en Git.
- **Aún NO disponible:** envío real a clientes, acceso público por propuesta, notificación de lectura, firma, mensajería externa o permisos individuales. La vista cliente sigue siendo previa interna.
- **No hay borrados automáticos de los antiguos datos locales**; la aplicación nueva simplemente no los utiliza. No borrar información de otros proyectos.

## Editor visual Carolina · 16/11/2026

- Tres páginas reales: **Portada, Collage y Propuesta**, compartidas entre diseñador y vista cliente. El motor PageFlip 3D no se modifica.
- Textos: toque para escribir sobre la página y guardar al tocar fuera; pulsación larga para mover, giro y escala con dos dedos y cuadrícula temporal. Títulos originales y textos añadidos se guardan por cotización en `carolinaLayout`, sin alterar la plantilla fuente.
- Fotos: un toque abre el editor de imagen (color, recorte, giro, opacidad y viñeta); pulsación larga mueve el marco y muestra la papelera. Reemplazar conserva los ajustes y Capas recupera fotos bajo textos. Se reutiliza el **mismo módulo de gestos** que en los textos.
- El collage de Carolina mantiene **seis bloques por defecto**, organizados como en el diseño original. En Diseño pueden añadirse hasta **12** recuadros; borrar la foto de un recuadro no reorganiza las demás. El antiguo panel de duplicación/reordenamiento ya no existe. Los recuadros ocultos no borran las fotografías de la biblioteca.
- Los cambios se guardan en D1 y se leen en Scroll/3D. **Pendiente:** QA táctil Samsung real, páginas variables y sincronización con Havana Calendario. Envíos reales no disponibles.

## Documentos
- [Estado vigente](docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md)
- [Arquitectura del editor](docs/10-ARQUITECTURA-EDITOR.md)
- [Videos: estado actual e historial](docs/11-PLAN-VIDEOS-3D.md)
- [Biblioteca multimedia optimizada](docs/12-BIBLIOTECA-MEDIOS.md)
- [Visión](docs/03-VISION-DEL-PRODUCTO.md)
- [Roadmap](docs/04-ROADMAP.md)
- [Protocolo de desarrollo](docs/05-PROTOCOLO-DE-DESARROLLO.md)
- [Decisiones](docs/06-DECISIONES.md)
- [Plan Maestro](https://github.com/Abnernoa97/havana-nice-quotes/issues/3)

## Desarrollo

```bash
bun install --frozen-lockfile
npm run build
npx wrangler deploy
```

`npm run build` ejecuta auditoría de código, tests y TypeScript antes de generar assets. Para producción se utiliza **exclusivamente Cloudflare** y solo un Worker.

**Importante:** el esquema está en `migrations/0001_quotes.sql` y `migrations/0002_passwordless_devices.sql`. D1 ya contiene las tablas necesarias; la invitación inicial solo se almacena en forma de hash en la base privada. No ejecutar migraciones destructivas ni guardar enlaces/tokens privados en Git.

**Continuidad:** antes de desarrollar leer este README, el estado vigente y el Plan Maestro, no documentos históricos obsoletos.

## Papelera

El menú lateral incluye Papelera unificada: permite restaurar o borrar definitivamente cotizaciones, fotografías y videos. Las imágenes permanecen en el mismo R2 hasta su purga y no se eliminan automáticamente. La categoría Archivos estará disponible cuando exista gestión de adjuntos.

## Primera plantilla real (Carolina)

El PDF de Canva Carolina guió un nuevo diseño nativo `carolina`: portada fotográfica, seis espacios de collage y tercera hoja de celebración/experiencia/producción. Las fotos se eligen del banco R2 de Quotes Studio, sin importar automáticamente imágenes del PDF. Los campos de cliente, fecha, venue, importe, moneda y anticipo se reutilizan; nueve textos de servicio están editables. Scroll mantiene tres páginas; la revista PageFlip utiliza una hoja reversa blanca para paginar sin modificar el motor.
