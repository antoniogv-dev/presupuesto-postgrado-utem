export const parameters = {
  teachingHour: { 2026: 23152, 2027: 24310, 2028: 25526, 2029: 26802, 2030: 28142 },
  replacementHour: 23152,
  thesisReviewPerStudent: 180000,
  annualTuition: { 2026: 4023852, 2027: 4182884, 2028: 4348182, 2029: 4519991, 2030: 4745991 },
  annualEnrollmentFee: { 2026: 192150, 2027: 201758, 2028: 211846, 2029: 222439, 2030: 233561 },
  annualDirection: { 2026: 3954929, 2027: 4152675, 2028: 4360309, 2029: 4578324, 2030: 4807240 },
  annualAssistance: { 2026: 2000000, 2027: 2100000, 2028: 2205000, 2029: 2315250, 2030: 2431013 },
  referenceOperational: { 2026: 1800000, 2027: 1890000, 2028: 1984500, 2029: 2083725, 2030: 2187911 },
  softwareLicenses: { 2026: 750000, 2027: 787500, 2028: 826875, 2029: 868219, 2030: 911630 },
  diffusionAdmission: { 2026: 1000000, 2027: 1050000, 2028: 1102500, 2029: 1157625, 2030: 1215506 },
  centralOverheadRate: 0.20,
  facultyOverheadRate: 0.10,
  badDebtRate: 0.15,
};

export function getActivePeriods(startYear, startSemester, durationSemesters) {
  if (!Number.isInteger(startYear) || startYear < 2000) throw new Error('Año de inicio inválido');
  if (![1, 2].includes(startSemester)) throw new Error('Semestre inválido');
  if (!Number.isInteger(durationSemesters) || durationSemesters < 2 || durationSemesters > 8) throw new Error('Duración inválida');
  return Array.from({ length: durationSemesters }, (_, index) => {
    const offset = startSemester - 1 + index;
    return { year: startYear + Math.floor(offset / 2), semester: (offset % 2) + 1, index };
  });
}

export function getActiveYears(periods) {
  return [...new Set(periods.map((period) => period.year))].sort((a, b) => a - b);
}

export function valueForYear(values, year) {
  if (values[year] !== undefined) return values[year];
  const available = Object.keys(values).map(Number).sort((a, b) => a - b);
  const previous = available.filter((candidate) => candidate <= year).at(-1);
  return values[previous ?? available[0]] ?? 0;
}

function tuitionForProgramYear(budget, p, year) {
  const custom = budget.program.annualTuition;
  return custom && Object.keys(custom).length ? valueForYear(custom, year) : valueForYear(p.annualTuition, year);
}

function periodInDiscount(period, discount) {
  const value = period.year * 2 + period.semester;
  return value >= discount.startYear * 2 + discount.startSemester && value <= discount.endYear * 2 + discount.endSemester;
}

export function createDemoBudget() {
  const startYear = 2027;
  const startSemester = 1;
  const durationSemesters = 4;
  const periods = getActivePeriods(startYear, startSemester, durationSemesters);
  return {
    id: 'mgp-2027-1',
    program: { id: 'mgp', code: 'MGP', name: 'Magíster en Gestión de Personas', type: 'MAGISTER_PROFESIONAL', annualTuition: { 2026: 4350000, 2027: 4567500, 2028: 4795875, 2029: 5035669, 2030: 5287452 }, tuitionSource: 'PROPIO' },
    cohortName: 'Cohorte 2027 · Primer semestre',
    startYear,
    startSemester,
    durationSemesters,
    initialStudents: 15,
    status: 'Borrador',
    facultyOverheadRate: 0.10,
    enrollmentRecognitionRate: 0.50,
    authorizedInitialCarryover: 0,
    version: 1,
    semesters: periods.map((period, index) => ({
      year: period.year,
      semester: period.semester,
      activeStudents: 15 - Math.floor(index / 2),
      directTeachingHours: index < durationSemesters - 1 ? 144 : 72,
      replacementTeachingHours: index === 1 ? 18 : 0,
      internalTuitionScholarshipStudents: 0,
      internalTuitionScholarshipCoverage: 1,
      maintenanceScholarshipStudents: 0,
      maintenanceScholarshipMonths: 0,
    })),
    discounts: [{ name: 'Convenio institucional', percentage: 0.20, students: 10, startYear: 2027, startSemester: 1, endYear: 2028, endSemester: 2 }],
    externalIncome: [{ type: 'Convenio', description: 'Aporte asociado a convenio', year: 2028, semester: 1, students: 2, amountPerStudent: 1200000 }],
    manualItems: [{ name: 'Apoyo metodológico', category: 'Honorarios no académicos', year: 2028, amount: 1200000, shared: false }],
  };
}

export function syncSemesters(budget) {
  const periods = getActivePeriods(budget.startYear, budget.startSemester, budget.durationSemesters);
  const existing = new Map(budget.semesters.map((s) => [`${s.year}-${s.semester}`, s]));
  budget.semesters = periods.map((period) => existing.get(`${period.year}-${period.semester}`) ?? {
    year: period.year,
    semester: period.semester,
    activeStudents: budget.initialStudents,
    directTeachingHours: 0,
    replacementTeachingHours: 0,
    internalTuitionScholarshipStudents: 0,
    internalTuitionScholarshipCoverage: 1,
    maintenanceScholarshipStudents: 0,
    maintenanceScholarshipMonths: 0,
  });
  return budget;
}

export function validateBudget(budget) {
  const warnings = [];
  for (const semester of budget.semesters) {
    const period = { year: semester.year, semester: semester.semester };
    const discounted = budget.discounts.filter((d) => periodInDiscount(period, d)).reduce((acc, d) => acc + d.students, 0);
    if (discounted > semester.activeStudents) warnings.push(`${semester.year}-${semester.semester}: descuentos superan estudiantes activos.`);
    if (discounted + semester.internalTuitionScholarshipStudents > semester.activeStudents) warnings.push(`${semester.year}-${semester.semester}: descuentos y becas superan estudiantes activos.`);
  }
  return [...new Set(warnings)];
}

export function calculateBudget(budget, p = parameters) {
  const periods = getActivePeriods(budget.startYear, budget.startSemester, budget.durationSemesters);
  const years = getActiveYears(periods);
  const semesterMap = new Map(budget.semesters.map((s) => [`${s.year}-${s.semester}`, s]));
  let previousAccumulated = budget.authorizedInitialCarryover;

  const annualFlows = years.map((year, yearIndex) => {
    const yearPeriods = periods.filter((period) => period.year === year);
    const semesters = yearPeriods.map((period) => semesterMap.get(`${period.year}-${period.semester}`)).filter(Boolean);
    const grossTuition = semesters.reduce((acc, s) => acc + s.activeStudents * tuitionForProgramYear(budget, p, s.year) * 0.5, 0);
    const discounts = semesters.reduce((acc, s) => acc + budget.discounts.filter((d) => periodInDiscount(s, d)).reduce((sub, d) => sub + d.students * tuitionForProgramYear(budget, p, s.year) * 0.5 * d.percentage, 0), 0);
    const internalTuitionScholarships = semesters.reduce((acc, s) => acc + s.internalTuitionScholarshipStudents * tuitionForProgramYear(budget, p, s.year) * 0.5 * s.internalTuitionScholarshipCoverage, 0);
    const tuitionAfterBenefits = Math.max(0, grossTuition - discounts - internalTuitionScholarships);
    const badDebt = tuitionAfterBenefits * p.badDebtRate;
    const netTuitionIncome = tuitionAfterBenefits - badDebt;
    const recognizedEnrollmentFee = semesters.reduce((acc, s) => acc + s.activeStudents * valueForYear(p.annualEnrollmentFee, s.year) * 0.5 * budget.enrollmentRecognitionRate, 0);
    const externalIncome = budget.externalIncome.filter((i) => i.year === year).reduce((acc, i) => acc + i.students * i.amountPerStudent, 0);
    const totalIncome = netTuitionIncome + recognizedEnrollmentFee + externalIncome;

    const academicHonoraria = semesters.reduce((acc, s) => acc + s.directTeachingHours * valueForYear(p.teachingHour, s.year) + s.replacementTeachingHours * p.replacementHour, 0);
    const thesisStudents = Math.max(0, ...semesters.map((s) => {
      const index = periods.find((period) => period.year === s.year && period.semester === s.semester)?.index ?? -1;
      return budget.program.type === 'DOCTORADO' ? (index >= 2 ? s.activeStudents : 0) : (index === budget.durationSemesters - 1 ? s.activeStudents : 0);
    }));
    const nonAcademicHonoraria = thesisStudents * p.thesisReviewPerStudent + budget.manualItems.filter((i) => i.year === year && i.category === 'Honorarios no académicos').reduce((acc, i) => acc + i.amount, 0);
    const direction = valueForYear(p.annualDirection, year);
    const assistance = valueForYear(p.annualAssistance, year);
    const operational = valueForYear(p.referenceOperational, year);
    const software = valueForYear(p.softwareLicenses, year);
    const diffusion = valueForYear(p.diffusionAdmission, year);
    const maintenanceScholarships = semesters.reduce((acc, s) => acc + s.maintenanceScholarshipStudents * s.maintenanceScholarshipMonths * 577500, 0);
    const centralOverhead = netTuitionIncome * p.centralOverheadRate;
    const facultyOverhead = netTuitionIncome * budget.facultyOverheadRate;
    const totalExpenses = academicHonoraria + nonAcademicHonoraria + direction + assistance + operational + software + diffusion + maintenanceScholarships + centralOverhead + facultyOverhead;
    const netFlow = totalIncome - totalExpenses;
    const startingCarryover = yearIndex === 0 ? budget.authorizedInitialCarryover : previousAccumulated;
    const accumulatedFlow = startingCarryover + netFlow;
    previousAccumulated = accumulatedFlow;
    return { year, grossTuition, discounts, internalTuitionScholarships, tuitionAfterBenefits, badDebt, netTuitionIncome, recognizedEnrollmentFee, externalIncome, totalIncome, academicHonoraria, nonAcademicHonoraria, direction, assistance, operational, software, diffusion, maintenanceScholarships, centralOverhead, facultyOverhead, totalExpenses, netFlow, startingCarryover, accumulatedFlow, thesisStudents };
  });

  const finalAccumulatedFlow = annualFlows.at(-1)?.accumulatedFlow ?? budget.authorizedInitialCarryover;
  return { periods, years, annualFlows, finalAccumulatedFlow, viable: budget.program.type === 'MAGISTER_PROFESIONAL' ? finalAccumulatedFlow >= 0 : null, warnings: validateBudget(budget) };
}

export function consolidateBudgets(budgets, p = parameters) {
  const calculated = budgets.map((budget) => ({ budget, result: calculateBudget(budget, p) }));
  const years = [...new Set(calculated.flatMap((entry) => entry.result.years))].sort((a, b) => a - b);
  return years.map((year) => {
    const entries = calculated.flatMap(({ budget, result }) => {
      const flow = result.annualFlows.find((candidate) => candidate.year === year);
      return flow ? [{ budget, flow }] : [];
    });
    const grossIncome = entries.reduce((acc, entry) => acc + entry.flow.totalIncome, 0);
    const grossExpenses = entries.reduce((acc, entry) => acc + entry.flow.totalExpenses, 0);
    const byProgram = new Map();
    for (const { budget, flow } of entries) {
      const current = byProgram.get(budget.program.id) ?? { direction: 0, assistance: 0, operational: 0, software: 0 };
      byProgram.set(budget.program.id, {
        direction: Math.max(current.direction, flow.direction),
        assistance: Math.max(current.assistance, flow.assistance),
        operational: Math.max(current.operational, flow.operational),
        software: Math.max(current.software, flow.software),
      });
    }
    const normalizedShared = [...byProgram.values()].reduce((acc, v) => acc + v.direction + v.assistance + v.operational + v.software, 0);
    const grossShared = entries.reduce((acc, e) => acc + e.flow.direction + e.flow.assistance + e.flow.operational + e.flow.software, 0);
    const duplicateAvoided = Math.max(0, grossShared - normalizedShared);
    const normalizedExpenses = grossExpenses - duplicateAvoided;
    return { year, grossIncome, grossExpenses, normalizedExpenses, duplicateAvoided, netFlow: grossIncome - normalizedExpenses };
  });
}

export function formatCLP(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(value)).replace('CLP', '$').replace(/\s+/g, ' ');
}
