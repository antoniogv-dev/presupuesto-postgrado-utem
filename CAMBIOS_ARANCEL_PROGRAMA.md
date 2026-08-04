# Cambio acotado: arancel anual propio por programa

Fecha: 3 de agosto de 2026

## Objetivo

Permitir que cada programa de postgrado mantenga un arancel anual propio, conservando el arancel institucional de doctorado como plantilla o valor de respaldo.

## Regla aplicada

Para cada programa y año:

1. Se utiliza el arancel anual configurado para el programa.
2. Si el programa no tiene un valor para ese año, se utiliza la plantilla institucional de doctorado.
3. El valor resuelto alimenta el arancel bruto, los descuentos y las becas internas de arancel.
4. La incobrabilidad y los overheads mantienen el orden de cálculo existente; no se modificaron sus fórmulas.

## Cambios funcionales

- Editor de arancel anual en el presupuesto.
- Vista de Programas con aranceles por año en la demostración autónoma.
- Acción para copiar la plantilla de doctorado.
- Identificación de la fuente: `PROPIO` o `PLANTILLA_DOCTORADO`.
- Persistencia local de la demostración para conservar el comportamiento que ya funcionaba en la web.

## Base de datos

Se agregó la entidad `ProgramAnnualTuition`, relacionada con `Program` y única por programa y año.

El parche aditivo está en:

`database/patches/20260803_add_program_annual_tuition.sql`

No elimina columnas, no modifica presupuestos existentes y puede ejecutarse más de una vez.

## API preparada

- `GET /api/programs/{programId}/tuition`
- `PUT /api/programs/{programId}/tuition`

En producción, la escritura requiere el encabezado `x-api-key`, cuyo valor debe coincidir con `PROGRAM_TUITION_API_KEY`.

## GitHub y Cloudflare

- Verificación automática en pull requests y en `main`.
- Aplicación manual y protegida del parche PostgreSQL.
- Configuración OpenNext para Cloudflare Workers.
- Ejemplo de binding Hyperdrive para PostgreSQL.
- Guía completa en `docs/despliegue-github-cloudflare.md`.

## Verificación

- Sintaxis JavaScript validada.
- Motor TypeScript compilado.
- 9 pruebas del motor aprobadas, incluida la prioridad del arancel propio sobre la plantilla.

## Pendiente institucional

Antes de habilitar edición pública en producción debe conectarse el mecanismo de autenticación institucional. La clave de API incluida es una protección técnica mínima para la ruta, no reemplaza un sistema de roles y permisos.
