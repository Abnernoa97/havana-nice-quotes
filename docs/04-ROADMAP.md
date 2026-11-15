# 04 · Roadmap priorizado

**Respaldo QN-00.04:** [procedimiento y punto de recuperación](07-RESPALDO.md).

**Clasificación QN-00.05:** [inventario y reglas de limpieza](08-CLASIFICACION-Y-LIMPIEZA.md).

El desarrollo avanza **en incrementos pequeños y publicables**, con prueba manual después de cada uno. Las fases siguientes son propuestas de trabajo; **no indican funcionalidades terminadas**.

## Fase 0 — Línea base y seguridad (prioridad inmediata)

- [x] Identificar repositorio, host y archivos.
- [x] Inventariar lo existente y separar demo / producción.
- [x] Documentar decisiones y límites.
- [x] Verificar la implementación activa de Cloudflare y registrar versión, despliegue y commit (QN-00.03).
- [ ] Probar Android instalado: Inicio, Cotizaciones, Datos, Diseño, Estilos, Precios, Scroll y Revista 3D.
- [ ] Revisar repo público y cambiarlo a privado con autorización/gestión de su propietario.
- [x] Añadir exportación local sin modificar la estructura de datos.
- [ ] Descargar y verificar un archivo JSON desde la PWA del Samsung.
- [ ] Descargar y conservar por separado el ZIP de código del commit de referencia.
- [ ] Diseñar restauración no destructiva antes de cualquier migración.
- [x] Inventariar y clasificar carpetas sin trasladar ni eliminar módulos (QN-00.05).
- [x] Agregar comprobador de estructura de solo lectura (`npm run audit:structure`).
- [ ] Ejecutar auditoría completa y verificar visualmente la app instalada.
- [ ] Versionar lockfile y asegurar compilaciones reproducibles.

**Terminado cuando:** existe una versión de referencia identificada, se prueban los flujos principales y no se ponen en riesgo datos ni otras aplicaciones.

## Fase 1 — Documento y páginas editables

- [ ] Definir modelo de documento versionado: páginas, bloques, tipo, orden, estilos y transiciones.
- [ ] Crear **gestor de páginas**: añadir, duplicar, reordenar y eliminar.
- [ ] Mantener compatibilidad con las cotizaciones actuales.
- [ ] Adaptar Vista cliente a páginas definidas por el editor, no seis hojas fijas.
- [ ] Separar el modelo y la UI de `App.tsx` sin rediseños innecesarios.

**Terminado cuando:** crear una página nueva en el editor hace que aparezca en la vista cliente y sobreviva a cerrar/reabrir, sin romper las propuestas antiguas.

## Fase 2 — Editor libre profesional

- [ ] Bloques de texto e imagen: colocar, mover, redimensionar, ordenar capas y alinear.
- [ ] Recorte/encuadre de foto, tipografía, espaciados, color y fondos.
- [ ] Undo/redo, selección múltiple y controles táctiles.
- [ ] Diseños y versiones específicas móvil/escritorio cuando tengan sentido.
- [ ] Previsualización instantánea fiable.

**Terminado cuando:** puede construirse una portada desde cero en el Samsung, mover texto y foto libremente y conservar el resultado.

## Fase 3 — Estilos editoriales con identidad propia

- [ ] Confirmar referencias nombradas «Deline» y «John Book».
- [ ] Investigar cada referencia real y documentar sus principios (jerarquía, columnas, espacio, tipografía, fotografía).
- [ ] Evolucionar las cinco opciones actuales de **skins CSS** a sistemas de composición que el usuario pueda mezclar y cambiar.
- [ ] Evitar reproducción de identidad, logotipos o páginas oficiales de terceros.

**Terminado cuando:** aplicar un estilo cambia la composición auténticamente y todos sus elementos siguen siendo editables.

## Fase 4 — Lectura avanzada

- [ ] Elegir Scroll / Flip / transición por sección o página.
- [ ] Refinar curva, cara reversa, sombras, esquinas y tacto del Flip.
- [ ] Ajustar pantallas chicas, tiempos de carga y accesibilidad.
- [ ] Separar el modo de lectura de la edición y de las acciones transaccionales.

**Terminado cuando:** las transiciones elegidas funcionan sin salto, bloqueo o pérdida de legibilidad en móvil y escritorio.

## Fase 5 — Plataforma real y privada (requiere aprobación)

- [ ] Autenticación de Fer & Noa, roles y permisos.
- [ ] Base de datos y almacenamiento privado de fotografías/documentos.
- [ ] Sincronización, copias de seguridad, versiones y recuperación.
- [ ] Links privados de cliente, mensajería, notificaciones y trazabilidad.
- [ ] Cotización contractual/Service Agreement, firma o aceptación verificable.
- [ ] Definir proveedores, límites, retención y costes antes de crear recursos.

**Terminado cuando:** la plataforma cumple requisitos de seguridad y los flujos comerciales se pueden validar de extremo a extremo con pruebas controladas.

## Orden de la próxima sesión

**Un solo objetivo:** Fase 0, pasar de un prototipo funcional a una **base validada y respaldable**. Después comenzar el gestor de páginas (Fase 1). Evitar desarrollar funcionalidades de varias fases en paralelo.
