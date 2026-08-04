# Publicación mediante GitHub y Cloudflare Workers

## 1. GitHub

1. Subir esta carpeta al repositorio.
2. Crear una rama `feature/arancel-programa`.
3. Revisar el cambio mediante pull request.
4. El workflow `Verificación` ejecutará TypeScript, pruebas y build.
5. Fusionar a `main` sólo después de aprobar la revisión.

El parche de producción es manual mediante **Actions > Aplicar parche de aranceles por programa > Run workflow**. El repositorio debe tener el secreto `DATABASE_URL` y, de preferencia, un environment protegido llamado `production`.

## 2. PostgreSQL

Antes de publicar la aplicación:

```bash
npm install
npm run db:generate
# Base nueva: npm run db:migrate -- --name inicial
# Base existente: ejecutar database/patches/20260803_add_program_annual_tuition.sql
```

El parche crea `ProgramAnnualTuition` sin modificar ni eliminar los presupuestos existentes. Es idempotente y puede volver a ejecutarse sin duplicar la tabla.

## 3. Cloudflare Workers

La aplicación usa OpenNext. Los archivos principales son:

- `open-next.config.ts`
- `wrangler.jsonc`
- `next.config.ts`

Para desplegar localmente:

```bash
npm run preview
npm run deploy
```

## 4. Integración GitHub–Cloudflare

En Cloudflare: **Workers & Pages > Create application > Import a repository**. Seleccionar el repositorio y configurar:

- Rama de producción: `main`.
- Build command: `npm run build:cloudflare`.
- Deploy command: `npm run deploy:only`.
- Root directory: raíz del repositorio.

Cloudflare puede desplegar cada push a `main` y generar versiones de vista previa para otras ramas.

## 5. Base de datos en Cloudflare

Opción recomendada: PostgreSQL administrado + Hyperdrive.

```bash
npx wrangler hyperdrive create postgrado-presupuestos --connection-string="postgres://USUARIO:CLAVE@HOST:5432/BASE"
```

Copiar el identificador devuelto a `wrangler.jsonc` usando como referencia `wrangler.hyperdrive.example.jsonc`. El binding debe llamarse `HYPERDRIVE`.

Como alternativa, configurar `DATABASE_URL` en **Settings > Variables & Secrets**. Configure también `PROGRAM_TUITION_API_KEY`. Nunca guardar claves reales en GitHub.

## 6. Orden seguro de publicación

1. Crear respaldo de PostgreSQL.
2. Ejecutar migración.
3. Probar la rama en una URL de preview.
4. Fusionar a `main`.
5. Verificar `/api/health`.
6. Consultar y actualizar un arancel de prueba.
7. Revisar un flujo financiero y confirmar que cambian arancel, descuentos, incobrabilidad y overhead.
