# 05 · Protocolo de desarrollo sin perder el control

## Alcance estricto

- **Único repo autorizado:** `Abnernoa97/havana-nice-quotes`.
- **Único destino:** Cloudflare Workers, cuenta **Solo Aplicaciones**, Worker `havana-nice-quotes`.
- No tocar ABNEROS, Calendario, otras apps, dominios ni proveedores.
- No sustituir infraestructura ni activar servicios de pago sin aprobación expresa.

## Antes de cambiar algo

1. Leer `README.md` y el documento de estado.
2. Verificar `main` y el commit desplegado (no asumir que GitHub = Cloudflare).
3. Precisar **qué pantalla/función** cambia y cuáles no se tocarán.
4. Guardar punto de regreso, considerar respaldo de `localStorage` cuando haya cambios de datos.
5. Hacer **un cambio lógico por commit**, sin acumular intentos ni CSS experimental no usado.

## Durante el desarrollo

- Trabajar preferentemente en componentes pequeños y aislados.
- Preservar la clave de `localStorage` y los campos existentes hasta diseñar una migración segura.
- No borrar cotizaciones locales ni reemplazar fotografías sin consentimiento.
- No duplicar componentes o mantener múltiples implementaciones de la misma función.
- No crear cuentas o servicios externos por conveniencia.
- Mantener español en el editor interno e inglés estadounidense natural en la propuesta final, salvo decisiones explícitas.
- Separar los estados: **hecho en código / build comprobado / desplegado / probado por el usuario**.

## Comprobación mínima antes de publicar

```bash
npm install
npm run build
```

Comprobar manualmente:
- [ ] Abre en Android y en escritorio.
- [ ] Inicio y menú inferior.
- [ ] Crear cotización de prueba, modificarla, guardar y reabrir.
- [ ] Datos, Estilos, Diseño y Precios.
- [ ] Vista del cliente con Scroll.
- [ ] Revista 3D: adelante/atrás, esquinas, sombra, último folio, regresar al editor.
- [ ] Cambio de estilo sin alterar nombre, presupuesto o descripción.
- [ ] Prueba de actualización con PWA instalada.
- [ ] No hay regresiones visuales ni textos que aparenten firma/envío real.

La ausencia de un paso de pruebas debe declararse, no darse por superado.

## Publicación y verificación

1. Subir el commit al repo.
2. Verificar el resultado del build de Cloudflare (compilación + deploy), sin asumir éxito.
3. Comprobar la versión publicada en la URL conocida, preferiblemente también en el móvil instalado.
4. Validar el objetivo del commit y dejar registro del resultado.
5. Si falla: revisar logs **antes de introducir cambios adicionales**. Volver a un commit conocido si procede, sin borrar datos locales.

**Importante:** al instalarse como PWA, el Service Worker puede conservar recursos estáticos antiguos. Diferenciar versión publicada, caché del cliente y fallos de compilación. No recomendar borrar datos/caché indiscriminadamente: allí viven las cotizaciones locales.

## Política de costos y privacidad

- No asumir que existen cuotas gratuitas ni que se ha verificado la facturación; consultar los límites vigentes antes de habilitar servicios.
- No gastar recursos de proyectos ajenos.
- No guardar API keys en cliente, GitHub ni capturas.
- Repositorio público y app sin login: **solo muestras ficticias**.
- No presentar mensajes, aceptación, contratos o pagos simulados como operaciones reales.

## Convención de versiones de trabajo

Usar una referencia legible por sesión: `QN-00` línea base auditada, `QN-01` páginas, `QN-02` editor libre, etc. Estas etiquetas documentales **no son tags de Git ni versiones desplegadas**. El SHA de Git y el ID del despliegue son los identificadores verificables.
