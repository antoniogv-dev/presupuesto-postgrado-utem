import { getActivePeriods, getActiveYears, isPeriodWithinRange, periodKey } from "./periods";
import type { AnnualFlow, BudgetItem, BudgetResult, CohortBudget, InstitutionalParameters, SemesterParameters } from "./types";

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);
const nonNegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);

export function parameterForYear(values: Record<number, number>, year: number): number {
  if (values[year] !== undefined) return values[year];
  const available = Object.keys(values).map(Number).sort((a, b) => a - b);
  const previous = available.filter((candidate) => candidate <= year).at(-1);
  return previous !== undefined ? values[previous] : values[available[0]] ?? 0;
}

export function tuitionForProgramYear(budget: CohortBudget, parameters: InstitutionalParameters, year: number): number {
  const customValues = budget.program.annualTuition;
  if (customValues && Object.keys(customValues).length > 0) return parameterForYear(customValues, year);
  return parameterForYear(parameters.annualTuition, year);
}

function sumManualItems(items: BudgetItem[], year: number, categories: BudgetItem["category"][]): number {
  return sum(items.filter((item) => item.year === year && categories.includes(item.category)).map((item) => nonNegative(item.amount)));
}

function thesisStudentsForSemester(budget: CohortBudget, semester: SemesterParameters): number {
  const periods = getActivePeriods(budget.startYear, budget.startSemester, budget.durationSemesters);
  const periodIndex = periods.find((period) => period.year === semester.year && period.semester === semester.semester)?.index ?? -1;
  if (periodIndex < 0) return 0;
  if (budget.program.type === "DOCTORADO") return periodIndex >= 2 ? semester.activeStudents : 0;
  return periodIndex === budget.durationSemesters - 1 ? semester.activeStudents : 0;
}

export function validateBudget(budget: CohortBudget): string[] {
  const warnings: string[] = [];
  for (const semester of budget.semesters) {
    const discounts = budget.discounts
      .filter((discount) => isPeriodWithinRange(semester.year, semester.semester, discount.startYear, discount.startSemester, discount.endYear, discount.endSemester))
      .reduce((acc, discount) => acc + discount.students, 0);
    if (discounts > semester.activeStudents) warnings.push(`${semester.year}-${semester.semester}: los descuentos superan los estudiantes activos.`);
    if (discounts + semester.internalTuitionScholarshipStudents > semester.activeStudents) {
      warnings.push(`${semester.year}-${semester.semester}: descuentos y becas internas superan los estudiantes activos.`);
    }
  }
  if (budget.facultyOverheadRate < 0 || budget.facultyOverheadRate > 1) warnings.push("El overhead de facultad debe estar entre 0 % y 100 %.");
  if (budget.enrollmentRecognitionRate < 0 || budget.enrollmentRecognitionRate > 1) warnings.push("El reconocimiento de matrícula debe estar entre 0 % y 100 %.");
  return [...new Set(warnings)];
}

export function calculateBudget(budget: CohortBudget, parameters: InstitutionalParameters): BudgetResult {
  const periods = getActivePeriods(budget.startYear, budget.startSemester, budget.durationSemesters);
  const years = getActiveYears(periods);
  const semesterMap = new Map(budget.semesters.map((semester) => [periodKey(semester.year, semester.semester), semester]));
  const warnings = validateBudget(budget);
  let previousAccumulated = budget.authorizedInitialCarryover;

  const annualFlows: AnnualFlow[] = years.map((year, yearIndex) => {
    const yearPeriods = periods.filter((period) => period.year === year);
    const semesters = yearPeriods.map((period) => semesterMap.get(periodKey(period.year, period.semester))).filter(Boolean) as SemesterParameters[];

    const grossTuition = sum(semesters.map((semester) => {
      const annualTuition = tuitionForProgramYear(budget, parameters, semester.year);
      return nonNegative(semester.activeStudents) * annualTuition * 0.5;
    }));

    const discounts = sum(semesters.flatMap((semester) => budget.discounts
      .filter((discount) => isPeriodWithinRange(semester.year, semester.semester, discount.startYear, discount.startSemester, discount.endYear, discount.endSemester))
      .map((discount) => nonNegative(discount.students) * tuitionForProgramYear(budget, parameters, semester.year) * 0.5 * nonNegative(discount.percentage))));

    const internalTuitionScholarships = sum(semesters.map((semester) =>
      nonNegative(semester.internalTuitionScholarshipStudents) * tuitionForProgramYear(budget, parameters, semester.year) * 0.5 * nonNegative(semester.internalTuitionScholarshipCoverage),
    ));

    const tuitionAfterBenefits = Math.max(0, grossTuition - discounts - internalTuitionScholarships);
    const badDebt = tuitionAfterBenefits * parameters.badDebtRate;
    const netTuitionIncome = tuitionAfterBenefits - badDebt;
    const recognizedEnrollmentFee = sum(semesters.map((semester) =>
      nonNegative(semester.activeStudents) * parameterForYear(parameters.annualEnrollmentFee, semester.year) * 0.5 * budget.enrollmentRecognitionRate,
    ));
    const externalIncome = sum(budget.externalIncome.filter((income) => income.year === year).map((income) => nonNegative(income.students) * nonNegative(income.amountPerStudent)));
    const otherIncome = 0;
    const totalIncome = netTuitionIncome + recognizedEnrollmentFee + externalIncome + otherIncome;

    const academicHonoraria = sum(semesters.map((semester) =>
      nonNegative(semester.directTeachingHours) * parameterForYear(parameters.teachingHour, semester.year)
      + nonNegative(semester.replacementTeachingHours) * parameters.replacementHour,
    )) + sumManualItems(budget.manualItems, year, ["Honorarios académicos"]);

    const thesisStudents = Math.max(0, ...semesters.map((semester) => thesisStudentsForSemester(budget, semester)));
    const nonAcademicHonoraria = thesisStudents * parameters.thesisReviewPerStudent
      + sumManualItems(budget.manualItems, year, ["Honorarios no académicos"]);

    const direction = parameterForYear(parameters.annualDirection, year) + sumManualItems(budget.manualItems, year, ["Dirección"]);
    const assistance = parameterForYear(parameters.annualAssistance, year) + sumManualItems(budget.manualItems, year, ["Asistencia"]);
    const operational = parameterForYear(parameters.referenceOperational, year) + sumManualItems(budget.manualItems, year, ["Gastos operacionales", "Bienes y servicios"]);
    const software = parameterForYear(parameters.softwareLicenses, year) + sumManualItems(budget.manualItems, year, ["Software"]);
    const diffusion = parameterForYear(parameters.diffusionAdmission, year) + sumManualItems(budget.manualItems, year, ["Difusión"]);
    const maintenanceScholarships = sum(semesters.map((semester) =>
      nonNegative(semester.maintenanceScholarshipStudents)
      * nonNegative(semester.maintenanceScholarshipMonths)
      * parameterForYear(parameters.maintenanceScholarshipMonthly, semester.year),
    )) + sumManualItems(budget.manualItems, year, ["Becas de manutención"]);
    const congressesInternships = parameterForYear(parameters.congressesInternships, year)
      + sumManualItems(budget.manualItems, year, ["Congresos", "Pasantías"]);
    const otherCosts = sumManualItems(budget.manualItems, year, ["Otros"]);
    const centralOverhead = netTuitionIncome * parameters.centralOverheadRate;
    const facultyOverhead = netTuitionIncome * budget.facultyOverheadRate;
    const totalExpenses = academicHonoraria + nonAcademicHonoraria + direction + assistance + operational + software + diffusion
      + maintenanceScholarships + congressesInternships + otherCosts + centralOverhead + facultyOverhead;
    const netFlow = totalIncome - totalExpenses;
    const startingCarryover = yearIndex === 0 ? budget.authorizedInitialCarryover : previousAccumulated;
    const accumulatedFlow = startingCarryover + netFlow;
    previousAccumulated = accumulatedFlow;

    return {
      year,
      activeSemesters: semesters.length,
      tuitionFactor: semesters.length * 0.5,
      grossTuition,
      discounts,
      internalTuitionScholarships,
      tuitionAfterBenefits,
      badDebt,
      netTuitionIncome,
      recognizedEnrollmentFee,
      externalIncome,
      otherIncome,
      totalIncome,
      academicHonoraria,
      nonAcademicHonoraria,
      direction,
      assistance,
      operational,
      software,
      diffusion,
      maintenanceScholarships,
      congressesInternships,
      otherCosts,
      centralOverhead,
      facultyOverhead,
      totalExpenses,
      netFlow,
      startingCarryover,
      accumulatedFlow,
      thesisStudents,
    };
  });

  const finalAccumulatedFlow = annualFlows.at(-1)?.accumulatedFlow ?? budget.authorizedInitialCarryover;
  const isProfessional = budget.program.type === "MAGISTER_PROFESIONAL";
  const viable = isProfessional ? finalAccumulatedFlow >= 0 : null;
  const deficitFlows = annualFlows.filter((flow) => flow.accumulatedFlow < 0).sort((a, b) => a.accumulatedFlow - b.accumulatedFlow);
  const breakEvenYear = annualFlows.find((flow) => flow.accumulatedFlow >= 0)?.year ?? null;

  return {
    periods,
    years,
    annualFlows,
    finalAccumulatedFlow,
    viable,
    worstDeficitYear: deficitFlows[0]?.year ?? null,
    breakEvenYear,
    warnings,
  };
}
