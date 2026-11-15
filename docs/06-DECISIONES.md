# 06 · Decisiones y restricciones vigentes

**Verificación:** 15/11/2026. Los commits anteriores y la evolución detallada están en el historial Git y en [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3), no en una segunda cronología de instrucciones.

## Decisiones confirmadas

- **HAVANA NICE Quotes Studio**: herramienta propia para propuestas editoriales de música en vivo destinada a bodas premium; editor interno en español y material público/cliente en inglés estadounidense.
- **Infraestructura:** GitHub `Abnernoa97/havana-nice-quotes` + Cloudflare Workers Static Assets (**Solo Aplicaciones**). No AppDeploy; no servicios de pago adicionales por defecto.
- **Una rama permanente:** `main`. La rama `work/qn-00-07-modularizacion` y su Preview se eliminaron y verificaron el 15/11/2026; **no volver a tratarlas como activas**.
- **Datos:** la nube comienza vacía. Existe backend privado D1 + R2; los envíos y confirmaciones de cliente siguen sin implementar.
- **Diseño:** revista editorial propia (no Canva ni PDF genérico). Page Flip 3D aprobado con hoja curvada, esquina y sombras. **No rediseñar el efecto ni ajustar velocidad durante la limpieza.**
- **Lectura:** conservar Scroll y Flip. Las seis hojas actuales son **fijas**; páginas libres y transiciones por bloque siguen pendientes.
- **Estilos:** cinco opciones internas (Libre, Vogue, The Lane, Junebug Weddings, New York Times). Son orientaciones visuales, no identidad oficial de terceros.
- **Código:** separar por `src/app/`, `src/features/`, `src/shared/` y `tests/`; evitar funciones duplicadas, archivos muertos, `@ts-nocheck` y ramas/implementaciones paralelas.
- **Guardado:** D1 con control de revisión. La clave anterior `hn_quotes_visual_v1` ya no se lee; no borrar automáticamente los datos históricos del navegador.
- **Prioridad actual:** sincronización en la nube y banco de fotografías para usar Quotes Studio desde varios teléfonos; después seguir con editor libre. El doblez 3D se conserva.

## Estado técnicamente demostrado

Último código verificado: `38c71ab94a78a553214f6db34e9ccab0a7ef57ca`; pasó 23/23 tests, `tsc`, Vite y deploy Cloudflare. Más detalles y caveats en [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md).

## Cambio de prioridad · 15/11/2026

- La prioridad ya no es exclusivamente la limpieza: **estudio de edición y experiencia visual del cliente completos primero**. La infraestructura interna de sincronización ya se aprobó. Las notificaciones de recepción, el estado de apertura y la ubicación se evaluarán después.
- La vista Scroll de la pareja y la vista previa en el editor deben renderizar el **mismo documento**. Para la Revista 3D el panel usa una portada liviana y el lector completo conserva PageFlip.
- Los cambios de apariencia no autorizan inventar envío, lectura de mensajes ni aceptación reales. Antes de producción comercial deberán resolverse la privacidad y el guardado seguro.

## Nueva prioridad: sincronización Cloudflare · 15/11/2026

- **Autorizado por Fer & Noa:** comenzar las cotizaciones y biblioteca de fotos de Quotes Studio completamente **desde cero**, sin importar las pruebas locales. No borrar ni migrar los datos de otros productos.
- **Cuenta Cloudflare existente:** `Solo Aplicaciones`, Worker `havana-nice-quotes`; mantener una sola app y publicar vía Workers Builds, no GitHub Actions.
- **D1 dedicado:** `havana-nice-quotes-sync` (ID `4c8403ed-94f3-4989-9016-4409fabf0f47`); **NO** usar `havana-events-sync` ni `havana-nice-v2-dev`.
- **R2 reutilizado sin borrar:** `havana-nice-v2-media` con prefijo privado `quotes-studio/photos/`. El dominio público R2.dev está deshabilitado.
- **Acceso sin contraseña (decisión posterior de Fer & Noa):** sin pantalla de login ni texto de contraseña. Cada teléfono se autoriza una sola vez mediante enlace de invitación de alta entropía y después usa sesión privada HttpOnly/Secure/SameSite=Strict. No se hace pública la API D1/R2 ni se utiliza Cloudflare Access, que no está habilitado.
- Cotizaciones se guardan de forma independiente con revisión en D1 y sincronización periódica. No dar por completado un guardado si el servidor no confirma; los conflictos quedan sin sobreescribir.
- Banco de fotos disponible desde menú y editor; nuevo panel de espacio usado refiere a la biblioteca propia, no a toda la cuenta R2. Mensajería/aceptación real, envío por enlace, analítica y alertas posteriores.

## Acceso sin contraseñas · 15/11/2026

- Fer & Noa rechazaron expresamente la pantalla de contraseña. La aplicación debe abrir directamente en dispositivos vinculados.
- Para agregar dispositivos, usar enlaces privados y efímeros emitidos desde un dispositivo ya autorizado, sin formularios ni cuentas de terceros.
- Mantener acceso cerrado en D1 y R2; quitar el login **no significa habilitar acceso anónimo** a cotizaciones o fotos.
- Las invitaciones tienen uso único; se almacenan únicamente hashes en D1, nunca tokens completos en Git o R2.
- El primer vínculo se entrega mediante un enlace administrativo temporal y se consume después del primer uso.

## Precios y anticipos · 15/11/2026

- El selector de moneda ofrece exactamente **USD y MX**; no hay conversión de divisas, tipo de cambio ni segundo precio.
- La moneda se guarda en cada cotización y aparece en las listas, editor y lecturas Scroll / Revista 3D. Registros anteriores sin moneda se interpretan como USD (sin modificar sus importes).
- Precio: campo numérico sin cero de relleno al comienzo; al enfocar se selecciona el importe actual y se normalizan ceros iniciales y separadores.
- Anticipo: entrada editable y desplegable de opciones **20, 30, 40, 50, 60, 70, 80, 90, 100 %**. El total se calcula de forma directa sobre el mismo importe sin conversiones.
- La implementación se mantiene modular: `QuotePricingPanel.tsx` y su `quote-pricing.css` propios; no se cambia el diseño ni los parámetros de PageFlip.

## Biblioteca independiente por aplicación · 15/11/2026

- Quotes Studio **solo muestra y utiliza las imágenes subidas manualmente desde la propia aplicación**. Las fotografías de HAVANA NICE v2, Book, Calendario o cualquier otro módulo no se muestran, consultan ni importan.
- Cloudflare R2 sigue siendo compartido físicamente, pero la app utiliza exclusivamente el prefijo propio `quotes-studio/photos/` y una tabla D1 exclusiva para su biblioteca. Los archivos externos existentes **no se borran ni alteran**.
- Eliminar de verdad: componentes, contador, consulta API y estilos de la antigua galería v2, no ocultarlos con CSS. Eliminar también las dos leyendas técnicas del pie de página y el CSS que ya no se utiliza.
- Conservar: selector de la galería nativa del teléfono, subida manual, conteo propio de fotografías, espacio utilizado, «Actualizar biblioteca», estado vacío aprobado y galería de dos columnas en móvil.
- La gestión de límites, carpetas y organización global de R2 se pospone para otra etapa. No crear infraestructura adicional ahora.

## Subida de fotografías en lote · 15/11/2026

- Selector nativo de archivos del teléfono con `multiple` en Fotos y Diseño; hasta **10 fotografías por selección**, sin limitar la cantidad total de imágenes de la biblioteca.
- Subida secuencial a R2 para limitar uso de red/memoria en móvil; indicador de progreso, resumen de éxitos y errores individuales. Las fotos ya cargadas se conservan si otra falla.
- La biblioteca se consulta una sola vez al terminar el lote; Diseño aplica la primera foto subida como portada y guarda el resto en la misma biblioteca.
- Se conservan el límite de **12 MB por fotografía**, la biblioteca aislada por aplicación y el diseño de dos columnas.

## Eliminación definitiva de fotografías de prueba · 15/11/2026

- Se eliminó por completo el archivo de stock y parejas ficticias de producción `src/features/quotes/demo-data.ts`; el constructor de borradores ya no importa datos demo y su portada comienza vacía.
- Se retiraron todas las fotografías externas incrustadas de Unsplash de Inicio, Scroll, estilos y las hojas de Revista 3D. Los espacios vacíos conservan su composición mediante fondos neutros de la marca, sin crear imágenes falsas ni modificar el motor PageFlip.
- Las cotizaciones sin foto muestran un ícono en las listas, en vez de solicitar `src=""`. Una portada real solo se muestra cuando fue elegida desde R2.
- No borrar fotografías reales subidas a `quotes-studio/photos/` ni otros recursos R2; de cotizaciones guardadas solo se quitan las URLs de stock claramente identificables.
- Se conserva la galería para subir material propio (máximo 10 fotos por selección). No reincorporar imágenes externas por defecto.

## Galería de fotos y eliminación definitiva · 15/11/2026

- **Galería solo de imágenes:** eliminar realmente los pies de tarjeta (nombres, extensiones y tamaño de cada imagen) y sus estilos, no ocultarlos con CSS. Conservar únicamente los contadores generales de la biblioteca arriba.
- Tocar una foto abre el visor a pantalla completa, con navegación anterior/siguiente y gesto horizontal en Android; la **tecla o botón Atrás nativo** cierra primero el visor.
- Mantener pulsada una foto en la galería activa selección múltiple; en escritorio se admite clic derecho. En modo selección se puede marcar/desmarcar y confirmar **eliminación definitiva**, o cancelar con Atrás nativo.
- Al confirmar, el Worker elimina los objetos propios de `quotes-studio/photos/` en R2 y sus registros D1, **nunca archivos de otras aplicaciones**. Si alguna foto era portada de una cotización, el servidor deja la portada vacía y aumenta la revisión de esa cotización para evitar referencias rotas y escrituras obsoletas.
- No se borran fotos al publicar esta funcionalidad: únicamente después de que Fer & Noa las seleccionen y acepten la confirmación en el estudio.
- No usar otra rama ni GitHub Actions, ni mover/eliminar fotografías de módulos externos.

## Papelera unificada · 15/11/2026

- La **Papelera** aparece en el menú lateral con filtros Todo, Cotizaciones, Fotos y Archivos. La sección Archivos se mantiene vacía mientras aún no exista carga de documentos adjuntos; no inventar funcionalidades.
- Eliminar desde Cotizaciones o Fotos ahora **mueve a Papelera** mediante `deleted_at` en las tablas D1 existentes. Los registros desaparecen del listado normal, pero se conservan completos y recuperables.
- Las imágenes mantienen el objeto original bajo `quotes-studio/photos/` en el mismo R2, sin copias ni migraciones. Mientras estén en Papelera, la URL normal de galería deja de servir la imagen; solo la Papelera privada puede verla.
- **Restaurar** reactiva el mismo registro D1 y objeto R2; **Eliminar** desde la Papelera requiere confirmación y borra definitivamente el objeto R2 y su registro D1. No hay borrado automático ni expiración.
- Las cotizaciones que usaban una portada enviada a Papelera se muestran sin portada, sin referencias rotas. Restaurar la foto no la asigna automáticamente: puede elegirse de nuevo.
- En esta etapa no se purga ningún elemento existente ni se alteran fotos de otras aplicaciones. Una sola rama `main` y publicación Cloudflare Workers Builds.

## Decisiones todavía abiertas

1. Confirmar los nombres originales de las referencias editoriales mencionadas fonéticamente como «Deline» y «John Book».
2. Definir esquema de páginas y bloques y política de deshacer/rehacer antes del editor libre.
3. Validar visual/táctil en Samsung y escritorio antes de retocar CSS o la revista.
4. Revisar costos, respaldos, permisos personales y enlaces privados antes de habilitar el envío real a clientes.
5. Determinar acceso privado del repositorio y medidas de seguridad antes de incorporar datos reales.

**Regla:** cuando cambie una decisión, actualizar este archivo y el Issue correspondiente. No duplicar estados vigentes en documentos históricos.
