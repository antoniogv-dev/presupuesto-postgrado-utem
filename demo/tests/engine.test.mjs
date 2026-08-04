import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudget, consolidateBudgets, createDemoBudget, getActivePeriods, getActiveYears, parameters, syncSemesters } from '../engine.mjs';

test('años activos 2028-2 por cuatro semestres', () => {
  const years = getActiveYears(getActivePeriods(2028, 2, 4));
  assert.deepEqual(years, [2028, 2029, 2030]);
  assert.equal(years.includes(2027), false);
});

test('prorrateo anual 0,5; 1,0; 0,5', () => {
  const periods = getActivePeriods(2027, 2, 4);
  const counts = [2027, 2028, 2029].map((year) => periods.filter((p) => p.year === year).length * 0.5);
  assert.deepEqual(counts, [0.5, 1, 0.5]);
});

test('descuento de diez estudiantes al 20 por ciento', () => {
  const budget = createDemoBudget();
  budget.semesters.forEach((s) => { s.activeStudents = 15; });
  const first = calculateBudget(budget).annualFlows[0];
  assert.equal(first.discounts, 10 * budget.program.annualTuition[2027] * 0.2);
});

test('incobrabilidad después de beneficios y overhead sobre ingreso neto', () => {
  const first = calculateBudget(createDemoBudget()).annualFlows[0];
  assert.equal(first.badDebt, first.tuitionAfterBenefits * parameters.badDebtRate);
  assert.equal(first.centralOverhead, first.netTuitionIncome * parameters.centralOverheadRate);
});

test('ingreso externo sólo en 2028', () => {
  const result = calculateBudget(createDemoBudget());
  assert.equal(result.annualFlows.find((f) => f.year === 2027).externalIncome, 0);
  assert.equal(result.annualFlows.find((f) => f.year === 2028).externalIncome, 2400000);
});

test('arrastre usa acumulado anterior', () => {
  const flows = calculateBudget(createDemoBudget()).annualFlows;
  assert.equal(flows[1].startingCarryover, flows[0].accumulatedFlow);
});

test('profesional deficitario es no viable', () => {
  const budget = createDemoBudget();
  budget.semesters.forEach((s) => { s.activeStudents = 0; });
  const result = calculateBudget(budget);
  assert.equal(result.viable, false);
  assert.ok(result.finalAccumulatedFlow < 0);
});

test('consolidación evita duplicidad de costos compartidos', () => {
  const one = createDemoBudget();
  const two = createDemoBudget();
  two.id = 'second'; two.startYear = 2026; two.startSemester = 2; syncSemesters(two);
  const rows = consolidateBudgets([one, two]);
  assert.ok(rows.some((row) => row.duplicateAvoided > 0));
});

test('el arancel propio del programa reemplaza la plantilla institucional', () => {
  const budget = createDemoBudget();
  budget.program.annualTuition = { 2027: 5000000, 2028: 5250000 };
  const result = calculateBudget(budget);
  assert.equal(result.annualFlows[0].grossTuition, 15 * 5000000);
});
