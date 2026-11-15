# HAVANA NICE · Quotes Studio

**Estudio privado de cotizaciones con sincronización Cloudflare**. Interfaz interna en español y propuestas editoriales para parejas estadounidenses en inglés.

## Acceso y publicación
- **Aplicación:** https://havana-nice-quotes.soloaplicaciones97.workers.dev
- **Repositorio:** `Abnernoa97/havana-nice-quotes` (`main`); GitHub solo conserva código. **Build y deployment por Cloudflare Workers Builds, NO GitHub Actions.**
- **Acceso privado:** contraseña del estudio; sesión segura HttpOnly/SameSite=Strict, validada en Worker. La contraseña no está en el código. **No compartir credenciales de acceso con clientes.**
- **Almacenamiento:** D1 `havana-nice-quotes-sync` guarda cotizaciones por ID y revisión; R2 privado existente `havana-nice-v2-media`, prefijo exclusivo `quotes-studio/photos/`, guarda imágenes. No se tocan archivos de Book v2 ni Calendario.
- **Datos iniciales:** cero cotizaciones y cero fotografías de Quotes Studio. No se importan ejemplos ni se leen borradores de `localStorage`. La biblioteca de fotos arranca vacía; se llena desde Fotos o Diseño.
- **Sincronización:** edición con auto-guardado, lectura cada 15 s y control de versión. Si otro teléfono modifica una cotización concurrentemente, no se sobrescribe en silencio: se muestra una incidencia para resolver. No dar por guardado si la nube está fuera de línea.
- **Banco de fotografías:** imágenes JPG, PNG, WebP, GIF, HEIC/HEIF hasta 12 MB; cuenta y tamaño total se refieren **solo a los objetos subidos para Quotes Studio**, no a toda la cuenta R2.
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

**Importante:** el schema está en `migrations/0001_quotes.sql`. La base D1 ya fue creada y las tablas inicializadas desde la API de Cloudflare. No ejecutar migraciones destructivas ni regenerar la credencial sin autorización. Ningún secreto, token o passphrase debe subirse al repositorio.

**Continuidad:** antes de desarrollar leer este README, el estado vigente y el Plan Maestro, no documentos históricos obsoletos.
