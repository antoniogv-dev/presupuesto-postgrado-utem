import type { CohortBudget, InstitutionalParameters, Program } from "./calculations/types";
import { getActivePeriods } from "./calculations/periods";

export const institutionalParameters: InstitutionalParameters = {
  teachingHour: { 2026: 23152, 2027: 24310, 2028: 25526, 2029: 26802, 2030: 28142 },
  replacementHour: 23152,
  thesisReviewPerStudent: 180000,
  maintenanceScholarshipMonthly: { 2026: 577500, 2027: 606375, 2028: 636694, 2029: 668529, 2030: 701956 },
  annualTuition: { 2026: 4023852, 2027: 4182884, 2028: 4348182, 2029: 4519991, 2030: 4745991 },
  annualEnrollmentFee: { 2026: 192150, 2027: 201758, 2028: 211846, 2029: 222439, 2030: 233561 },
  annualDirection: { 2026: 3954929, 2027: 4152675, 2028: 4360309, 2029: 4578324, 2030: 4807240 },
  annualAssistance: { 2026: 2000000, 2027: 2100000, 2028: 2205000, 2029: 2315250, 2030: 2431013 },
  referenceOperational: { 2026: 1800000, 2027: 1890000, 2028: 1984500, 2029: 2083725, 2030: 2187911 },
  softwareLicenses: { 2026: 750000, 2027: 787500, 2028: 826875, 2029: 868219, 2030: 911630 },
  diffusionAdmission: { 2026: 1000000, 2027: 1050000, 2028: 1102500, 2029: 1157625, 2030: 1215506 },
  congressesInternships: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 0 },
  annualAdjustmentRate: 0.05,
  centralOverheadRate: 0.20,
  facultyOverheadRate: 0.10,
  badDebtRate: 0.15,
  planningHorizonYears: 6,
};

export const programs: Program[] = [
  { id: "mgp", code: "MGP", name: "Magíster en Gestión de Personas", type: "MAGISTER_PROFESIONAL", faculty: "Facultad de Administración y Economía", director: "Leonardo Gatica", officialDurationSemesters: 4, status: "Activo", costCenter: "01080300-021", annualTuition: { 2026: 4350000, 2027: 4567500, 2028: 4795875, 2029: 5035669, 2030: 5287452 }, tuitionSource: "PROPIO" },
  { id: "docmip", code: "DOCMIP", name: "Doctorado en Ciencias de Materiales e Ingeniería de Procesos", type: "DOCTORADO", faculty: "Facultad de Ciencias Naturales, Matemática y del Medio Ambiente", director: "Abdoulaye Thiam", officialDurationSemesters: 8, status: "Activo", costCenter: "01080300-011", annualTuition: { ...institutionalParameters.annualTuition }, tuitionSource: "PLANTILLA_DOCTORADO" },
  { id: "mq", code: "MQ", name: "Magíster en Química", type: "MAGISTER_ACADEMICO", faculty: "Facultad de Ciencias Naturales, Matemática y del Medio Ambiente", director: "Katherine Paredes", officialDurationSemesters: 4, status: "Activo", annualTuition: { 2026: 4023852, 2027: 4182884, 2028: 4348182, 2029: 4519991, 2030: 4745991 }, tuitionSource: "PROPIO" },
  { id: "mees", code: "MEES", name: "Magíster en Eficiencia Energética y Sustentabilidad", type: "MAGISTER_PROFESIONAL", faculty: "Facultad de Ingeniería", director: "Siva Avudaiappan", officialDurationSemesters: 4, status: "Activo", annualTuition: { 2026: 4150000, 2027: 4357500, 2028: 4575375, 2029: 4804144, 2030: 5044351 }, tuitionSource: "PROPIO" },
];

function semesters(startYear: number, startSemester: 1 | 2, duration: number, students: number) {
  return getActivePeriods(startYear, startSemester, duration).map((period, index) => ({
    year: period.year,
    semester: period.semester,
    activeStudents: Math.max(0, students - Math.floor(index / 2)),
    directTeachingHours: index < duration - 1 ? 144 : 72,
    replacementTeachingHours: index === 1 ? 18 : 0,
    electiveSubjects: index >= 2 ? 2 : 0,
    electiveSections: index >= 2 ? 2 : 0,
    specializedCourses: 0,
    specializedSections: 0,
    internalTuitionScholarshipStudents: 0,
    internalTuitionScholarshipCoverage: 1,
    maintenanceScholarshipStudents: 0,
    maintenanceScholarshipMonths: 0,
    notes: "",
  }));
}

export const demoBudget: CohortBudget = {
  id: "mgp-2027-1",
  program: programs[0],
  cohortName: "Cohorte 2027 · Primer semestre",
  startYear: 2027,
  startSemester: 1,
  durationSemesters: 4,
  initialStudents: 15,
  status: "Borrador",
  facultyOverheadRate: 0.10,
  enrollmentRecognitionRate: 0.50,
  authorizedInitialCarryover: 0,
  responsible: "M. Antonio Gutiérrez Varas",
  version: 1,
  createdAt: "2026-08-02",
  notes: "Presupuesto de demostración para formulación 2027.",
  semesters: semesters(2027, 1, 4, 15),
  discounts: [
    { id: "d1", name: "Convenio institucional", percentage: 0.20, students: 10, startYear: 2027, startSemester: 1, endYear: 2028, endSemester: 2, note: "Grupo de convenio" },
  ],
  externalIncome: [
    { id: "e1", type: "Convenio", description: "Aporte asociado a convenio", year: 2028, semester: 1, students: 2, amountPerStudent: 1200000, source: "Convenio institucional" },
  ],
  manualItems: [
    { id: "c1", name: "Apoyo metodológico", description: "Servicio específico para la cohorte", category: "Honorarios no académicos", year: 2028, semester: 1, amount: 1200000, costType: "Propio de la cohorte", periodicity: "Único" },
  ],
};

export const secondDemoBudget: CohortBudget = {
  ...demoBudget,
  id: "mgp-2026-2",
  cohortName: "Cohorte 2026 · Segundo semestre",
  startYear: 2026,
  startSemester: 2,
  initialStudents: 12,
  status: "Aprobado",
  version: 3,
  semesters: semesters(2026, 2, 4, 12),
  discounts: [],
  externalIncome: [],
  manualItems: [],
};
