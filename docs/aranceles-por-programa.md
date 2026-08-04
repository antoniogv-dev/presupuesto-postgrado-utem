# Aranceles personalizados por programa

## Regla aplicada

1. Cada programa puede registrar un arancel anual propio.
2. El motor financiero usa primero `ProgramAnnualTuition`.
3. Si no existe un valor propio, utiliza la plantilla institucional de doctorado (`InstitutionalParameter` / `annualTuition`).
4. Descuentos, becas internas de arancel, incobrabilidad y overhead se calculan sobre el mismo arancel resuelto para el programa.
5. El valor se registra por año para conservar trazabilidad y evitar que un reajuste futuro modifique presupuestos históricos.

## Modelo de datos

- `ProgramAnnualTuition.programId`: programa propietario.
- `year`: año de vigencia.
- `amount`: monto anual en pesos chilenos.
- `source`: `PROPIO` o `PLANTILLA_DOCTORADO`.
- Índice único: programa + año.

## API

- `GET /api/programs/{programId}/tuition`
- `PUT /api/programs/{programId}/tuition` (requiere `x-api-key` en producción)

Ejemplo de actualización:

```json
{
  "values": [
    { "year": 2027, "amount": 4567500, "source": "PROPIO" },
    { "year": 2028, "amount": 4795875, "source": "PROPIO" }
  ]
}
```

En producción configure `PROGRAM_TUITION_API_KEY` como secreto de Cloudflare. La aplicación completa también debe protegerse con autenticación institucional o Cloudflare Access.
