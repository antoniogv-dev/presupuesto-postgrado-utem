import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrismaClient } from "@/lib/database/prisma";

const tuitionPayload = z.object({
  values: z.array(z.object({
    year: z.number().int().min(2000).max(2100),
    amount: z.number().int().nonnegative(),
    source: z.enum(["PROPIO", "PLANTILLA_DOCTORADO"]).default("PROPIO"),
  })).min(1),
});

type RouteContext = { params: Promise<{ programId: string }> };

export const dynamic = "force-dynamic";

function canWrite(request: Request): boolean {
  const expected = process.env.PROGRAM_TUITION_API_KEY;
  if (!expected) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-api-key") === expected;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { programId } = await context.params;
    const prisma = getPrismaClient();
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, code: true, name: true, annualTuitions: { orderBy: { year: "asc" } } },
    });
    if (!program) return NextResponse.json({ message: "Programa no encontrado." }, { status: 404 });
    return NextResponse.json({
      ...program,
      annualTuitions: program.annualTuitions.map((value) => ({ ...value, amount: Number(value.amount) })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "No fue posible consultar los aranceles del programa." }, { status: 503 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!canWrite(request)) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  try {
    const { programId } = await context.params;
    const payload = tuitionPayload.parse(await request.json());
    const prisma = getPrismaClient();
    const exists = await prisma.program.findUnique({ where: { id: programId }, select: { id: true } });
    if (!exists) return NextResponse.json({ message: "Programa no encontrado." }, { status: 404 });

    await prisma.$transaction(payload.values.map((value) => prisma.programAnnualTuition.upsert({
      where: { programId_year: { programId, year: value.year } },
      update: { amount: BigInt(value.amount), source: value.source },
      create: { programId, year: value.year, amount: BigInt(value.amount), source: value.source },
    })));

    return NextResponse.json({ message: "Aranceles del programa actualizados.", values: payload.values });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Datos de arancel inválidos.", issues: error.issues }, { status: 400 });
    console.error(error);
    return NextResponse.json({ message: "No fue posible actualizar los aranceles del programa." }, { status: 503 });
  }
}
