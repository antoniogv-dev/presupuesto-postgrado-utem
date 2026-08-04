import { PrismaClient, ProgramStatus, ProgramType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.upsert({
    where: { code: "GESTOR" },
    update: {},
    create: { code: "GESTOR", name: "Gestor presupuestario", description: "Crea y mantiene borradores presupuestarios." },
  });
  const user = await prisma.user.upsert({
    where: { email: "manuel.gutierrez@utem.cl" },
    update: {},
    create: { email: "manuel.gutierrez@utem.cl", name: "M. Antonio Gutiérrez Varas" },
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  const program = await prisma.program.upsert({
    where: { code: "MGP" },
    update: {},
    create: {
      code: "MGP",
      name: "Magíster en Gestión de Personas",
      type: ProgramType.MAGISTER_PROFESIONAL,
      faculty: "Facultad de Administración y Economía",
      director: "Leonardo Gatica",
      officialDurationSemesters: 4,
      status: ProgramStatus.ACTIVO,
      costCenter: "01080300-021",
    },
  });
  const annualTuition = { 2026: 4350000, 2027: 4567500, 2028: 4795875, 2029: 5035669, 2030: 5287452 };
  for (const [year, amount] of Object.entries(annualTuition)) {
    await prisma.programAnnualTuition.upsert({
      where: { programId_year: { programId: program.id, year: Number(year) } },
      update: { amount: BigInt(amount), source: "PROPIO" },
      create: { programId: program.id, year: Number(year), amount: BigInt(amount), source: "PROPIO" },
    });
  }
  console.log("Datos de demostración y aranceles por programa creados.");
}

main().finally(async () => prisma.$disconnect());
