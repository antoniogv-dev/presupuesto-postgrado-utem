import { describe, expect, it } from "vitest";
import { calculateBudget } from "@/lib/calculations/budget-engine";
import { consolidateBudgets } from "@/lib/calculations/consolidation";
import { demoBudget, institutionalParameters, secondDemoBudget } from "@/lib/demo-data";

const clone = <T,>(value: T): T => structuredClone(value);

describe("motor financiero", () => {
  it("calcula grupos con descuento sin alterar estudiantes sin descuento", () => {
    const budget = clone(demoBudget);
    budget.initialStudents = 15;
    budget.semesters.forEach((semester) => { semester.activeStudents = 15; });
    budget.discounts = [{ id: "d", name: "Convenio", percentage: 0.2, students: 10, startYear: 2027, startSemester: 1, endYear: 2028, endSemester: 2 }];
    const result = calculateBudget(budget, institutionalParameters);
    const expected2027 = 10 * (demoBudget.program.annualTuition?.[2027] ?? 0) * 0.2;
    expect(result.annualFlows[0].discounts).toBe(expected2027);
  });

  it("aplica incobrabilidad después de descuentos y no a matrícula", () => {
    const result = calculateBudget(demoBudget, institutionalParameters);
    const first = result.annualFlows[0];
    expect(first.badDebt).toBeCloseTo(first.tuitionAfterBenefits * institutionalParameters.badDebtRate, 2);
    expect(first.totalExpenses).not.toBe(first.totalExpenses + first.badDebt);
    expect(first.recognizedEnrollmentFee).toBeGreaterThan(0);
  });

  it("calcula overhead sólo sobre ingreso neto por arancel", () => {
    const first = calculateBudget(demoBudget, institutionalParameters).annualFlows[0];
    expect(first.centralOverhead).toBeCloseTo(first.netTuitionIncome * institutionalParameters.centralOverheadRate, 2);
    expect(first.facultyOverhead).toBeCloseTo(first.netTuitionIncome * demoBudget.facultyOverheadRate, 2);
  });

  it("reconoce 50 por ciento de matrícula", () => {
    const firstSemester = demoBudget.semesters[0];
    const first = calculateBudget(demoBudget, institutionalParameters).annualFlows[0];
    const expected = demoBudget.semesters.filter((s) => s.year === 2027).reduce((acc, s) => acc + s.activeStudents * institutionalParameters.annualEnrollmentFee[2027] * 0.5 * 0.5, 0);
    expect(first.recognizedEnrollmentFee).toBe(expected);
    expect(firstSemester.activeStudents).toBeGreaterThan(0);
  });

  it("reconoce ingreso externo sólo en el año configurado", () => {
    const result = calculateBudget(demoBudget, institutionalParameters);
    expect(result.annualFlows.find((f) => f.year === 2027)?.externalIncome).toBe(0);
    expect(result.annualFlows.find((f) => f.year === 2028)?.externalIncome).toBe(2400000);
  });

  it("considera tesistas de magíster sólo en el último semestre", () => {
    const result = calculateBudget(demoBudget, institutionalParameters);
    expect(result.annualFlows[0].thesisStudents).toBe(0);
    expect(result.annualFlows.at(-1)?.thesisStudents).toBe(demoBudget.semesters.at(-1)?.activeStudents);
  });

  it("considera tesistas doctorales desde el tercer semestre", () => {
    const budget = clone(demoBudget);
    budget.program.type = "DOCTORADO";
    budget.durationSemesters = 4;
    const result = calculateBudget(budget, institutionalParameters);
    expect(result.annualFlows[0].thesisStudents).toBe(0);
    expect(result.annualFlows[1].thesisStudents).toBeGreaterThan(0);
  });

  it("convierte el acumulado anterior en arrastre siguiente", () => {
    const result = calculateBudget(demoBudget, institutionalParameters);
    expect(result.annualFlows[1].startingCarryover).toBe(result.annualFlows[0].accumulatedFlow);
  });

  it("no duplica costos compartidos en consolidación", () => {
    const rows = consolidateBudgets([demoBudget, secondDemoBudget], institutionalParameters);
    expect(rows.some((row) => row.duplicateAvoided > 0)).toBe(true);
  });

  it("marca no viable a un profesional con acumulado negativo", () => {
    const budget = clone(demoBudget);
    budget.semesters.forEach((semester) => { semester.activeStudents = 0; });
    const result = calculateBudget(budget, institutionalParameters);
    expect(result.finalAccumulatedFlow).toBeLessThan(0);
    expect(result.viable).toBe(false);
  });
});


it("usa el arancel propio del programa antes que la plantilla institucional", () => {
  const budget = structuredClone(demoBudget);
  budget.program.annualTuition = { 2027: 5000000, 2028: 5250000 };
  const result = calculateBudget(budget, institutionalParameters);
  expect(result.annualFlows[0].grossTuition).toBe(15 * 5000000);
});
