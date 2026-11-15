# HAVANA NICE · Quotes Studio

**Estudio privado de cotizaciones con sincronización Cloudflare**. Interfaz interna en español y propuestas editoriales para parejas estadounidenses en inglés.

## Acceso y publicación
- **Aplicación:** https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Repositorio:** `Abnernoa97/havana-nice-quotes` (`main`); GitHub solo conserva código. **Build y deployment por Cloudflare Workers Builds, NO GitHub Actions.**
- **Sin contraseña:** cada teléfono se vincula mediante un enlace privado de un solo uso. Una vez vinculado abre la app directamente con una sesión de dispositivo HttpOnly/Secure/SameSite=Strict; sin formulario de contraseña. Desde el estudio se crea un enlace para otro teléfono, válido 20 minutos. **No compartir invitaciones con clientes.**
- **Almacenamiento:** D1 `havana-nice-quotes-sync` guarda cotizaciones por ID y revisión; R2 privado existente `havana-nice-v2-media`, prefijo exclusivo `quotes-studio/photos/`, guarda imágenes. No se tocan archivos de Book v2 ni Calendario.
- **Borradores y fotografías:** los borradores nuevos empiezan sin portada de prueba. Se eliminó el archivo de cotizaciones ficticias y todas las referencias a bancos de imágenes de stock en la interfaz y revista; únicamente se usan las fotografías reales subidas desde Fotos o Diseño. No se leen borradores de `localStorage`. Las fotografías existentes subidas por los dueños se conservan.
- **Sincronización:** edición con auto-guardado, lectura cada 15 s y control de versión. Si otro teléfono modifica una cotización concurrentemente, no se sobrescribe en silencio: se muestra una incidencia para resolver. No dar por guardado si la nube está fuera de línea.
- **Banco de fotografías:** **solo fotos subidas manualmente desde Quotes Studio**, mediante el selector nativo del teléfono. Se pueden seleccionar hasta 10 fotos a la vez desde Fotos o Diseño (sin límite total de la biblioteca). Las fotos JPG, PNG, WebP, GIF, HEIC/HEIF hasta 12 MB cada una se guardan en `quotes-studio/photos/`; cantidad y tamaño total corresponden exclusivamente a esta biblioteca. La galería no consulta ni presenta imágenes de otras aplicaciones aunque compartan el mismo R2. El botón de actualizar recarga solo esta biblioteca.
- **Primer acceso:** el enlace inicial se genera una sola vez por Cloudflare desde una autorización administrativa segura. Se utiliza en el navegador o PWA que se desea vincular. El token solo viaja en el fragmento de la URL y se consume al abrirse; no se guarda en Git.
- **Aún NO disponible:** envío real a clientes, acceso público por propuesta, notificación de lectura, firma, mensajería externa o permisos individuales. La vista cliente sigue siendo previa interna.
- **No hay borrados automáticos de los antiguos datos locales**; la aplicación nueva simplemente no los utiliza. No borrar información de otros proyectos.

## Documentos
- [Estado vigente](docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md)
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
