# 06 · Decisiones y restricciones vigentes

**Verificación:** 15/11/2026. Los commits anteriores y la evolución detallada están en el historial Git y en [Issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3), no en una segunda cronología de instrucciones.

## Decisiones confirmadas

- **HAVANA NICE Quotes Studio**: herramienta propia para propuestas editoriales de música en vivo destinada a bodas premium; editor interno en español y material público/cliente en inglés estadounidense.
- **Infraestructura:** GitHub `Abnernoa97/havana-nice-quotes` + Cloudflare Workers Static Assets (**Solo Aplicaciones**). No AppDeploy; no servicios de pago adicionales por defecto.
- **Una rama permanente:** `main`. La rama `work/qn-00-07-modularizacion` y su Preview se eliminaron y verificaron el 15/11/2026; **no volver a tratarlas como activas**.
- **Todo el contenido actual es ficticio.** Sin backend, login ni datos comerciales reales. El JSON de respaldo de la demo se eliminó por innecesario; no bloquea la evolución del prototipo.
- **Diseño:** revista editorial propia (no Canva ni PDF genérico). Page Flip 3D aprobado con hoja curvada, esquina y sombras. **No rediseñar el efecto ni ajustar velocidad durante la limpieza.**
- **Lectura:** conservar Scroll y Flip. Las seis hojas actuales son **fijas**; páginas libres y transiciones por bloque siguen pendientes.
- **Estilos:** cinco opciones internas (Libre, Vogue, The Lane, Junebug Weddings, New York Times). Son orientaciones visuales, no identidad oficial de terceros.
- **Código:** separar por `src/app/`, `src/features/`, `src/shared/` y `tests/`; evitar funciones duplicadas, archivos muertos, `@ts-nocheck` y ramas/implementaciones paralelas.
- **Guardado de la demo:** almacenamiento local `hn_quotes_visual_v1`; no borrar automáticamente cotizaciones locales ni credenciales.
- **Prioridad actual:** terminar orden técnico/documental; optimización de velocidad, doblez y microdetalles **pospuesta a otra etapa** por decisión del propietario.

## Estado técnicamente demostrado

Último código verificado: `38c71ab94a78a553214f6db34e9ccab0a7ef57ca`; pasó 23/23 tests, `tsc`, Vite y deploy Cloudflare. Más detalles y caveats en [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md).

## Decisiones todavía abiertas

1. Confirmar los nombres originales de las referencias editoriales mencionadas fonéticamente como «Deline» y «John Book».
2. Definir esquema de páginas y bloques y política de deshacer/rehacer antes del editor libre.
3. Validar visual/táctil en Samsung y escritorio antes de retocar CSS o la revista.
4. Elegir backend, privacidad, autenticación, enlaces y límites de costo **solo cuando se apruebe una etapa comercial real**.
5. Determinar acceso privado del repositorio y medidas de seguridad antes de incorporar datos reales.

**Regla:** cuando cambie una decisión, actualizar este archivo y el Issue correspondiente. No duplicar estados vigentes en documentos históricos.
