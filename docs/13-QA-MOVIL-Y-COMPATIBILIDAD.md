# 13 · QA progresivo: CSS, cotizaciones existentes y móviles

**Estado: preparación del control de calidad · 20/11/2026.**
Repositorio único `Abnernoa97/havana-nice-quotes`, rama única `main`. Este documento no certifica pruebas físicas que todavía no se han realizado.

## 4. CSS: aceptación

- Cada componente es propietario de sus CSS; el selector de medios mantiene sus ajustes móviles en `editor/photos/photo-source-picker.css`, no en el lienzo.
- Los estilos del lienzo no pueden sobrescribir mensajes del selector y viceversa. `tests/editor-error-style-scope.test.mjs` comprueba ese aislamiento.
- Confirmar en Android/iPhone: ancho estrecho, orientación vertical/horizontal, teclado abierto, paneles sin solapamientos, scroll independiente del selector.
- La revisión visual en dispositivo sigue **pendiente**; un análisis estático no demuestra equivalencia de píxeles.

## 5. Compatibilidad: aceptación

- Las cotizaciones históricas **sin** `designLayout` siguen utilizando Portada (0), Collage (1) y Propuesta (2); al convertirlas en plantilla no deben convertirse en una página en blanco.
- Las cotizaciones con `designLayout` mantienen ID, orden de páginas, textos, fotos, video, geometrías y efectos. La creación de una plantilla clona el diseño y nunca modifica el registro de origen.
- Los nuevos documentos creados desde cero mantienen la hoja blanca con ID 3.
- `tests/quote-legacy-compat.test.mjs` contiene casos sintéticos, sin consultar ni modificar D1/R2 de clientes.
- Compatibilidad con un formato **anterior a la eliminación del campo `carolinaLayout`**: **no certificada**; ese modelo se retiró en una fase previa y no debe declararse recuperado sin estudiar un respaldo antiguo.

## 6. Matriz de pruebas móviles

| Caso | Prueba concreta en dispositivo | Resultado esperado | Estado |
|---|---|---|---|
| Inicio y navegación | Inicio → Cotizaciones → Editor → Atrás del sistema | Sin saltos de sección o bloqueos | Pendiente |
| Persistencia | Crear → escribir texto → guardar → cerrar → reabrir | Mismo contenido y página | Pendiente |
| Cambio de página | Iniciar texto sin confirmar → cambiar página | No se guarda texto vacío ni quedan herramientas anteriores | Pendiente |
| Página independiente | + Página → foto/texto → duplicar → ordenar → eliminar | Cada hoja conserva sus propios elementos | Pendiente |
| Selección de medios | Banco → foto y video → reemplazar → cerrar | Controles sin solapamientos; estilos preservados | Pendiente |
| Gestos de texto | Tocar, mantener, mover, girar, confirmar | Una acción a la vez; scroll normal cuando no se transforma | Pendiente |
| Edición de foto | Recorte, zoom, color, viñeta, opacidad, reemplazo | Tratamiento intacto después de guardar y reabrir | Pendiente |
| Vista cliente | Scroll y revista 3D (inicio, centro, último folio) | Páginas idénticas a Diseño | Pendiente |
| Estados de red | Abrir cotización sincronizada → desconectar → reconectar | No perder cambios ni sobrescribir otro dispositivo | Pendiente |
| Accesibilidad y orientación | Vertical, horizontal y teclado | Nada oculto; botones y regreso accesibles | Pendiente |

**Dispositivos:** Android y iPhone reales. Registrar por caso el modelo, sistema, fecha, commit desplegado, resultado (aprobado/falló), captura cuando exista un fallo y su módulo responsable.

## Protocolo por cambio

1. Modificar únicamente el módulo propietario en `main`.
2. Ejecutar `npm run build` (auditoría, pruebas, tipos y Vite). Un commit en GitHub no equivale a versión publicada.
3. Verificar en Cloudflare el despliegue del commit que se pretende probar, sin interferir con D1/R2.
4. Comprobar en el teléfono solo los casos afectados y los recorridos críticos relacionados.
5. Si falla, corregir en el mismo módulo y actualizar el caso; no marcar «aprobado» hasta haberlo visto funcionar realmente.

## Estado de la fase

- CSS del selector de medios: responsabilidades separadas en código, **QA visual móvil pendiente**.
- Modelo de cotizaciones: corregida conversión de fuentes con/sin `designLayout`; **regresión con datos reales pendiente**.
- Comprobación móvil: matriz preparada, **sin resultados físicos todavía**.
