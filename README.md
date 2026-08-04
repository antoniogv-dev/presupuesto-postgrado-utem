# Sistema de Presupuestos de Postgrado UTEM

Aplicación web para formular, evaluar, consolidar y seguir presupuestos de cohortes de programas de postgrado.

## Alcance de esta versión

Esta entrega es una primera versión funcional que incluye:

- Panel general.
- Catálogo de programas con arancel anual personalizado.
- Editor interactivo de una cohorte.
- Cálculo de periodos activos y prorrateo semestral.
- Descuentos, becas internas, ingresos externos, matrícula e incobrabilidad.
- Costos, overhead y revisión de tesis.
- Flujo anual, arrastre, acumulado y viabilidad profesional.
- Consolidado con normalización de costos compartidos.
- Diseño responsive y criterios WCAG 2.2 AA.
- Esquema PostgreSQL/Prisma, incluyendo aranceles anuales por programa.
- Pruebas unitarias y E2E base.

La interfaz funciona inicialmente con datos de demostración y guarda el borrador en `localStorage`. El esquema de Prisma deja preparada la persistencia institucional.

## Demostración sin instalación

Abra directamente `demo/index.html`. Esta versión autónoma permite navegar por el panel, editar la cohorte, guardar el borrador y revisar el consolidado sin instalar dependencias.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker, sólo si se utilizará PostgreSQL local.

## Instalación de la versión Next.js

```bash
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Base de datos PostgreSQL

```bash
docker compose up -d
npm run db:generate
npm run db:migrate -- --name inicial
npm run db:seed
```

## Verificación

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Arquitectura

- `app/`: rutas Next.js App Router.
- `components/`: componentes visuales transversales.
- `features/budgets/`: experiencia de edición presupuestaria.
- `lib/calculations/`: motor financiero puro y testeable.
- `lib/database/`: reservado para repositorios y servicios de persistencia.
- `prisma/`: modelo de datos y semilla.
- `tests/unit/`: pruebas de reglas financieras.
- `e2e/`: pruebas Playwright.
- `docs/formulas.md`: documentación de fórmulas.

## Decisiones de diseño

1. La lógica financiera no vive en componentes React.
2. Los montos se modelan en pesos enteros en la capa de cálculo y como `BigInt`/`Decimal` en PostgreSQL.
3. La incobrabilidad reduce ingresos y nunca se duplica como egreso.
4. El flujo financiero es el último bloque del editor.
5. La consolidación normaliza costos compartidos por programa, año y categoría.
6. Las versiones aprobadas se representan como inmutables en el modelo de datos.

## Pendientes de validación institucional

- Valor oficial de revisión de tesis.
- Definición exacta del costo compartido cuando las cohortes presentan montos distintos: máximo, valor aprobado o regla de prorrateo.
- Momento exacto de reconocimiento de matrícula en cohortes con retiro o deserción.
- Integración con autenticación institucional y sistemas UTEM.
- Formatos oficiales de exportación Excel/PDF.

## Verificación realizada en esta entrega

- Compilación TypeScript del motor financiero puro.
- Ocho pruebas automáticas del motor autónomo.
- Validación sintáctica de JavaScript y lectura HTML.
- Verificación de carga mediante servidor HTTP local.

El entorno de construcción utilizado no dispone de acceso al registro público de npm; por ello, la compilación completa de Next.js debe ejecutarse en un entorno con acceso normal al registro público de npm.


## Arancel propio por programa

Cada programa puede definir montos anuales propios. El arancel institucional se conserva como plantilla de doctorado y sólo se usa cuando no existe un valor personalizado. Consulte `docs/aranceles-por-programa.md`.

## GitHub y Cloudflare

El proyecto incluye configuración OpenNext para Cloudflare Workers, workflows de verificación y una migración manual protegida. Consulte `docs/despliegue-github-cloudflare.md`.

Para una base existente, aplique `database/patches/20260803_add_program_annual_tuition.sql` en vez de regenerar el esquema.
