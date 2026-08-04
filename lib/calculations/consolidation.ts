import { calculateBudget } from "./budget-engine";
import type { BudgetItem, CohortBudget, InstitutionalParameters } from "./types";

export interface ConsolidatedYear {
  year: number;
  grossIncome: number;
  grossExpenses: number;
  normalizedExpenses: number;
  duplicateAvoided: number;
  netFlow: number;
}

const SHARED_CATEGORIES: BudgetItem["category"][] = ["Dirección", "Asistencia", "Gastos operacionales", "Software"];

export function consolidateBudgets(budgets: CohortBudget[], parameters: InstitutionalParameters): ConsolidatedYear[] {
  const calculated = budgets.map((budget) => ({ budget, result: calculateBudget(budget, parameters) }));
  const years = [...new Set(calculated.flatMap(({ result }) => result.years))].sort((a, b) => a - b);

  return years.map((year) => {
    const entries = calculated.flatMap(({ budget, result }) => {
      const flow = result.annualFlows.find((candidate) => candidate.year === year);
      return flow ? [{ budget, flow }] : [];
    });
    const grossIncome = entries.reduce((acc, entry) => acc + entry.flow.totalIncome, 0);
    const grossExpenses = entries.reduce((acc, entry) => acc + entry.flow.totalExpenses, 0);

    const sharedByProgram = new Map<string, { direction: number; assistance: number; operational: number; software: number }>();
    for (const { budget, flow } of entries) {
      const current = sharedByProgram.get(budget.program.id) ?? { direction: 0, assistance: 0, operational: 0, software: 0 };
      sharedByProgram.set(budget.program.id, {
        direction: Math.max(current.direction, flow.direction),
        assistance: Math.max(current.assistance, flow.assistance),
        operational: Math.max(current.operational, flow.operational),
        software: Math.max(current.software, flow.software),
      });
    }
    const normalizedShared = [...sharedByProgram.values()].reduce((acc, current) => acc + current.direction + current.assistance + current.operational + current.software, 0);
    const grossShared = entries.reduce((acc, entry) => acc + entry.flow.direction + entry.flow.assistance + entry.flow.operational + entry.flow.software, 0);
    const duplicateAvoided = Math.max(0, grossShared - normalizedShared);
    const normalizedExpenses = grossExpenses - duplicateAvoided;

    return { year, grossIncome, grossExpenses, normalizedExpenses, duplicateAvoided, netFlow: grossIncome - normalizedExpenses };
  });
}

export { SHARED_CATEGORIES };
