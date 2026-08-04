-- Parche aditivo e idempotente para una base ya creada con el esquema anterior.
-- No elimina ni modifica presupuestos existentes.

DO $$
BEGIN
  CREATE TYPE "TuitionSource" AS ENUM ('PROPIO', 'PLANTILLA_DOCTORADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProgramAnnualTuition" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "source" "TuitionSource" NOT NULL DEFAULT 'PROPIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramAnnualTuition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProgramAnnualTuition_programId_year_key"
  ON "ProgramAnnualTuition"("programId", "year");

CREATE INDEX IF NOT EXISTS "ProgramAnnualTuition_year_idx"
  ON "ProgramAnnualTuition"("year");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProgramAnnualTuition_amount_nonnegative'
  ) THEN
    ALTER TABLE "ProgramAnnualTuition"
      ADD CONSTRAINT "ProgramAnnualTuition_amount_nonnegative" CHECK ("amount" >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProgramAnnualTuition_programId_fkey'
  ) THEN
    ALTER TABLE "ProgramAnnualTuition"
      ADD CONSTRAINT "ProgramAnnualTuition_programId_fkey"
      FOREIGN KEY ("programId") REFERENCES "Program"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
