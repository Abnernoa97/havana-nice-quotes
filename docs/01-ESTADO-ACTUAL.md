# 01 · Estado actual

**ACTUALIZACIÓN VIGENTE 15/11/2026:** [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md) prevalece sobre este inventario histórico. `main` publicado: `4bbeb050`, Cloudflare versión `250131a4-8ff9-4a8c-9622-25f92ec7e292`. Las cotizaciones actuales son **solo ficticias**; no hay bloqueo por respaldo JSON del Samsung. La exportación de JSON se añadió como función opcional. La clasificación de archivos QN-00.05 está documentada en [08-CLASIFICACION-Y-LIMPIEZA](08-CLASIFICACION-Y-LIMPIEZA.md).

**Corte:** 15 de noviembre de 2026. **Base de código inspeccionada:** `d129e4261b9dbe2b7b32670f306e763032dca31f` (`main`). El repositorio quedó sin commits posteriores a la biblioteca de Estilos al realizar la auditoría. Se distingue abajo lo visto en código de lo comprobado por el usuario.

## Inventario verificable

| Módulo | Estado | Evidencia / límite |
| --- | --- | --- |
| Inicio y navegación | Implementado en React | Cuatro secciones: Inicio, Cotizaciones, Diseñador, Mensajes |
| Cotizaciones | Demo funcional | Crear, seleccionar, editar, filtrar y guardar en `localStorage`; tres ejemplos iniciales |
| Diseñador · Datos | Implementado | Pareja, venue, fecha, mensaje, paquete, descripción |
| Diseñador · Diseño | Implementado | Fotografía (muestras y subida local), dos familias de título y color |
| Diseñador · Precios | Implementado | Precio en USD, porcentaje de anticipo y cálculo |
| Biblioteca · Estilos | En código; requiere validar publicación y revisión visual | Libre, Vogue, The Lane, Junebug Weddings, The New York Times; son interpretaciones propias, no plantillas oficiales |
| Vista cliente Scroll | Demo funcional | Presentación web con contenido y acciones simuladas |
| Vista cliente Revista 3D | Demo funcional; probada por el usuario | `page-flip`, seis páginas fijas, sombras, pliegues y navegación táctil |
| Android PWA | Instalación confirmada por el usuario | Manifest, íconos, Service Worker y modo standalone |
| Mensajería | Simulada | Mensajes en el mismo estado local, sin servidor ni entrega real |
| Aceptación de propuesta | Simulada | Modifica estado ficticio; **no es firma ni aceptación contractual** |
| Compartir propuesta | No implementado | El botón avisa que todavía es demo |
| Editor libre por capas | No implementado | Actualmente se seleccionan estilos y controles; no existe arrastre libre de elementos |
| Gestor de páginas | No implementado | Las páginas de la revista están definidas en el componente |
| Backend y usuarios | No implementados | Sin sesiones, roles, API o base de datos |
| Sincronización / copias de seguridad | No implementadas | Los borradores dependen del navegador y dispositivo |
| Firma y contratos | No implementados | No usar aceptación simulada como prueba legal |

## Decisiones ya tomadas

1. El cliente debe ver **una propuesta editorial**, no un PDF genérico.
2. El **Page Flip 3D completo** es una opción, no una animación obligatoria en todas las páginas o cotizaciones.
3. El editor será **muy completo y libre**, pero sencillo de usar en móvil. Los estilos son puntos de partida editables, no límites.
4. La biblioteca se llama **Estilos**, no Plantillas.
5. Mantener la identidad propia de HAVANA NICE, sin copiar identidades o logotipos de otras publicaciones.
6. Infraestructura dedicada: GitHub `Abnernoa97/havana-nice-quotes` + Cloudflare **Solo Aplicaciones**. No AppDeploy como host final.

## Advertencias que impiden uso comercial real

- El repositorio figuraba **público** en la consulta del 15/11/2026; debe revisarse su visibilidad antes de datos sensibles.
- La app pública no tiene autenticación ni autorización; no cargar nombres completos, teléfonos, presupuestos reales ni contratos de clientes.
- `localStorage` puede perderse por limpieza de datos/cambios de dispositivo, y las fotos en base64 pueden superar la cuota.
- No existe respaldo, migraciones de datos, seguridad de enlaces o control de acceso.
- No se verificaron pruebas automáticas ni compilación local durante esta auditoría.
- No se verificó la **versión activa en Cloudflare** ni facturación/consumos; el código de GitHub no prueba qué commit se publicó.

## Punto de control

**Estado actual (15/11):** compilación integral y publicación de QN-00.08 confirmadas, revisión del Preview aprobada por el usuario. Sigue pendiente la limpieza Nivel Dios del [issue #3](https://github.com/Abnernoa97/havana-nice-quotes/issues/3). No exigir respaldo de registros ficticios para continuar; revisar producción y nuevas funciones con pruebas reales.
