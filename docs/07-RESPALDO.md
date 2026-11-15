# QN-00.04 · Respaldo del proyecto y de los borradores

> **Estado vigente (15/11/2026):** el propietario confirma que **todos los datos actuales son ficticios**. Este documento describe una herramienta de exportación opcional y puntos de recuperación del **código**; descargar JSON del Samsung **NO es un requisito ni bloquea el plan Nivel Dios**. Ver [09 · Estado vigente](09-ESTADO-VIGENTE-Y-LIMPIEZA.md).

Fecha de referencia: **15 de noviembre de 2026**.

## A. Código fuente — punto de recuperación

- **Repositorio:** `Abnernoa97/havana-nice-quotes`.
- **Commit validado en Cloudflare antes de activar la exportación:** `395f8d0ec1bad29c09ef9c655c5fd17f91ff9b62`.
- **Despliegue Cloudflare:** `0e3d1d97-c133-4326-8e12-e2ef3af6b0bf`.
- **Versión Cloudflare:** `c4c522b2-e606-4a06-897f-62dcd691fbe8` (número 9, tráfico 100 % al verificar).
- **Compilación de Cloudflare:** éxito, commit `395f8d0`.
- **Descarga del código completo:** https://github.com/Abnernoa97/havana-nice-quotes/archive/395f8d0ec1bad29c09ef9c655c5fd17f91ff9b62.zip

Este commit contiene los archivos de código, documentación, manifiesto, estilos, iconos y configuración. GitHub **no contiene los borradores que únicamente existen en el almacenamiento local del teléfono**. La URL de descarga permite generar el archivo ZIP, pero el ZIP **no está todavía guardado en otro soporte** hasta que alguien lo descargue.

No crear una rama de respaldo sin necesidad: Cloudflare tiene compilaciones de Git conectadas y las ramas adicionales pueden disparar previews.

## B. Cotizaciones del Samsung — copia individual, fuera de la nube

La demo guarda los borradores en la clave `hn_quotes_visual_v1` dentro del `localStorage` de esa instalación/navegador. La PWA y Chrome pueden tener distintas particiones de almacenamiento según la instalación.

Se añadió una acción **Cotizaciones → Respaldar datos**. Genera en el mismo dispositivo:

```
HAVANA_NICE_QUOTES_RESPALDO_YYYY-MM-DD.json
```

Formato del archivo:

```json
{
  "format": "havana-nice-quotes-backup",
  "schemaVersion": 1,
  "exportedAt": "fecha ISO",
  "storageKey": "hn_quotes_visual_v1",
  "quotes": []
}
```

El archivo contiene todas las propuestas del dispositivo desde el que se pulse el botón, incluyendo fotografías incorporadas en base64 si se guardaron así, mensajes y precios. **Es privado**: no compartirlo públicamente, no enviarlo por chat sin necesidad y no subirlo a GitHub.

### Verificación obligatoria

1. Abrir la PWA instalada en Android.
2. Entrar en **Cotizaciones** y pulsar **Respaldar datos**.
3. Revisar **Mis archivos / Descargas** y localizar el JSON.
4. Abrirlo como texto y confirmar que aparecen `format` y `quotes` y que tiene contenido. Si se usó una instalación de navegador diferente, repetir allí.
5. Guardar una segunda copia en un lugar privado confiable.

**Importante:** exportar y respaldar **no equivale a importar o restaurar**. Antes de cambiar el almacenamiento se deberá implementar importación validada de forma no destructiva. No eliminar la PWA, borrar caché ni limpiar datos hasta completar esa prueba.

## C. Estado pendiente del control

- [x] Commit reproducible identificado.
- [x] Versión y despliegue Cloudflare identificados.
- [x] Función de exportación local agregada al código.
- [x] Nueva compilación y despliegue confirmados (commit `f3f83e5`, versión `b8ab531d-cace-466a-ae5a-7e874ed0bf14`, 15/11/2026).
- [ ] Usuario descargó y verificó el JSON del Samsung.
- [ ] Usuario descargó un ZIP de código en un soporte externo.
- [ ] Implementar restauración no destructiva antes de cualquier migración de datos.

La exportación de muestras y su descarga externa quedan **opcionales** mientras solo existan datos ficticios. Para recuperación del código existen commits en GitHub y versiones Cloudflare; no confundirlos con respaldos de datos reales. Una estrategia de respaldo de producción sí será obligatoria **antes** de usar información comercial real.
