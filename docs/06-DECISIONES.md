# 06 · Registro de decisiones y cuestiones abiertas

Este archivo refleja decisiones conocidas por el historial del proyecto y el código. Si una nueva preferencia cambia algo, registrar fecha, alcance y motivo.

## Confirmadas

| Fecha | Decisión | Consecuencia |
| --- | --- | --- |
| 15–17 oct 2026 | App propia, publicada con GitHub + Cloudflare Workers en Solo Aplicaciones | No alojar definitivamente en AppDeploy; aislar el proyecto |
| 17 oct 2026 | Comunicación y aspecto editorial de revista de lujo, no estilo Canva ni PDF genérico | La propuesta del cliente debe tener diseño editorial original |
| 17–18 oct 2026 | **Page Flip A**, con hoja 3D, curva, esquina y sombras | Implementado como demo, aprobado por usuario; no imponerlo siempre |
| 18 oct 2026 | Modo de lectura configurable | Scroll y Revista 3D deben coexistir |
| 18 oct 2026 | PWA para instalar directamente en Android | Usuario confirmó instalación; no APK nativa |
| 18 oct 2026 | **Estilos** en vez de **Plantillas** | Biblioteca editorial con selección y personalización |
| 18 oct 2026 | Libertad en fuentes, imágenes, posiciones y composición | Editor libre profesional es objetivo, todavía pendiente |
| 15 nov 2026 | Ordenar el repositorio y documentar antes de ampliar funciones | Esta documentación es la nueva guía de continuidad |

## Implementaciones localizables por commit

| SHA inicial | Trabajo |
| --- | --- |
| `d0de1ea8` | Primer diseñador React/Vite |
| `de9fc566` | Eliminación del redirect infinito en Workers |
| `ac29ab9d` | Lector con Page Flip |
| `f65ecab5` | Corrección `loadFromHTML` |
| `350dad72` | PWA, manifest, íconos y botón de instalación |
| `9c3c3c56` | Corrección de `ImportMeta.env` en el registro PWA |
| `d129e426` | Biblioteca de Estilos y modo de lectura por cotización |

## Actualizaciones confirmadas · 15 de noviembre de 2026

- El propietario confirma que **todos los datos de cotizaciones actuales son ficticios**. No bloquear refactorización por una descarga JSON del Samsung.
- QN-00.08: integración del PR #2 a `main` (`4bbeb050c905de02cb1861d824ee2591ba4b9158`) y Cloudflare versión `250131a4-8ff9-4a8c-9622-25f92ec7e292` publicada al 100 %.
- Los archivos de las ramas `main` y `work/qn-00-07-modularizacion` eran idénticos al compararlos por SHA de blob; la segunda está pendiente de eliminación.
- Plan de cierre de limpieza QN-00.09: [issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3).

## Por resolver

1. ¿Las referencias que el usuario dijo como «Deline» y «John Book» son efectivamente **The Lane** y **Junebug Weddings**? Se interpretaron así en la implementación, sin validación explícita del nombre.
2. **Resuelto en Cloudflare:** el commit publicado es `4bbeb050`, versión `250131a4-8ff9-4a8c-9622-25f92ec7e292` (15/11/2026). La versión efectivamente cargada por la PWA instalada en Android debe verificarse tras actualizar.
3. ¿Se ha configurado acceso privado al repositorio y a la aplicación? En la auditoría el repo seguía público y la app no tiene login.
4. ¿Cuál será el modelo de páginas libres y la política de undo/redo? Requiere diseño técnico y prueba móvil.
5. ¿Qué backend/almacenamiento/firma se utilizará y cuáles son límites y costos? **Pendiente de decisión**, no crear recursos hasta aprobar.

## Criterio de continuidad

Cuando se retome el proyecto desde otra conversación: leer primero `README.md` y `docs/09-ESTADO-VIGENTE-Y-LIMPIEZA.md`, y consultar los demás documentos solo según el módulo, inspeccionar siempre `main`, identificar la versión activa si se puede, y cambiar **una pieza comprobable cada vez**.
