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

## Por resolver

1. ¿Las referencias que el usuario dijo como «Deline» y «John Book» son efectivamente **The Lane** y **Junebug Weddings**? Se interpretaron así en la implementación, sin validación explícita del nombre.
2. ¿Qué commit quedó **publicado** en Cloudflare y qué versión está instalada en Android? GitHub no demuestra automáticamente el despliegue.
3. ¿Se ha configurado acceso privado al repositorio y a la aplicación? En la auditoría el repo seguía público y la app no tiene login.
4. ¿Cuál será el modelo de páginas libres y la política de undo/redo? Requiere diseño técnico y prueba móvil.
5. ¿Qué backend/almacenamiento/firma se utilizará y cuáles son límites y costos? **Pendiente de decisión**, no crear recursos hasta aprobar.

## Criterio de continuidad

Cuando se retome el proyecto desde otra conversación: leer los seis documentos antes de editar, inspeccionar siempre `main`, identificar la versión activa si se puede, y cambiar **una pieza comprobable cada vez**.
