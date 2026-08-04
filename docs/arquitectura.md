# Arquitectura funcional y técnica

## Capas

1. **Presentación:** Next.js App Router, componentes React y CSS basado en tokens.
2. **Aplicación:** casos de uso para crear cohortes, versionar, aprobar, consolidar y exportar.
3. **Dominio:** motor financiero puro en `lib/calculations`.
4. **Validación:** esquemas Zod independientes de la interfaz.
5. **Persistencia:** Prisma ORM y PostgreSQL.
6. **Auditoría:** versiones inmutables, aprobaciones y registro de cambios.

## Flujo funcional

Programa → aranceles anuales propios → presupuesto/cohorte → periodos semestrales → beneficios e ingresos → costos → flujo anual → viabilidad → consolidación.

## Motor financiero

El motor recibe una estructura `CohortBudget` y parámetros institucionales. Devuelve periodos activos, flujos anuales, acumulado final, viabilidad y advertencias. No depende de React, Prisma ni del navegador.

## Persistencia prevista

La demostración usa almacenamiento local para facilitar la revisión inmediata. La capa Prisma contiene las entidades necesarias, incluida `ProgramAnnualTuition`, para migrar a persistencia institucional sin alterar las fórmulas.
