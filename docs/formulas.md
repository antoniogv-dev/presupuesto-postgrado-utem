# Fórmulas financieras implementadas

## Periodos y prorrateo

Los periodos activos se generan exclusivamente desde el año, semestre de inicio y duración. Cada semestre activo representa 0,5 del arancel anual.

## Ingreso neto por arancel

1. Arancel aplicable = arancel anual propio del programa; si no existe, plantilla institucional de doctorado.
2. Arancel bruto = estudiantes activos × arancel aplicable × 0,5 por semestre.
3. Arancel después de beneficios = arancel bruto − descuentos − becas internas de arancel.
4. Incobrabilidad = arancel después de beneficios × porcentaje de incobrabilidad.
5. Ingreso neto por arancel = arancel después de beneficios − incobrabilidad.

La incobrabilidad reduce el ingreso. No se registra nuevamente como egreso.

## Matrícula

Ingreso reconocido = estudiantes activos × matrícula anual × 0,5 por semestre × porcentaje reconocido.

No se aplica incobrabilidad ni overhead sobre matrícula.

## Overhead

- Overhead central = ingreso neto por arancel × porcentaje central.
- Overhead facultad = ingreso neto por arancel × porcentaje particular de la cohorte.

## Tesistas

- Magísteres: último semestre.
- Doctorados: desde el tercer semestre.
- Revisión anual: máximo de estudiantes tesistas entre los semestres del año.
- Clasificación: honorarios no académicos.

## Flujo

- Flujo neto anual = total de ingresos − total de egresos.
- Arrastre del primer año = arrastre inicial autorizado.
- Arrastre de años siguientes = flujo acumulado del año anterior.
- Flujo acumulado = arrastre inicial del año + flujo neto anual.

## Costos compartidos

Normalización por programa + año + categoría. En esta versión inicial se conserva el mayor monto anual de dirección, asistencia, gastos operacionales y software entre cohortes simultáneas del mismo programa.
