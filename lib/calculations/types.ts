export type ProgramType = "DOCTORADO" | "MAGISTER_ACADEMICO" | "MAGISTER_PROFESIONAL" | "OTRO";
export type SemesterNumber = 1 | 2;
export type BudgetStatus = "Borrador" | "En revisión" | "Observado" | "Aprobado" | "Reemplazado";
export type TuitionSource = "PROPIO" | "PLANTILLA_DOCTORADO";

export interface Program {
  id: string;
  code: string;
  name: string;
  type: ProgramType;
  faculty: string;
  director: string;
  officialDurationSemesters: number;
  status: "Activo" | "Inactivo" | "En diseño";
  costCenter?: string;
  annualTuition?: Record<number, number>;
  tuitionSource?: TuitionSource;
}

export interface InstitutionalParameters {
  teachingHour: Record<number, number>;
  replacementHour: number;
  thesisReviewPerStudent: number;
  maintenanceScholarshipMonthly: Record<number, number>;
  annualTuition: Record<number, number>;
  annualEnrollmentFee: Record<number, number>;
  annualDirection: Record<number, number>;
  annualAssistance: Record<number, number>;
  referenceOperational: Record<number, number>;
  softwareLicenses: Record<number, number>;
  diffusionAdmission: Record<number, number>;
  congressesInternships: Record<number, number>;
  annualAdjustmentRate: number;
  centralOverheadRate: number;
  facultyOverheadRate: number;
  badDebtRate: number;
  planningHorizonYears: number;
}

export interface SemesterParameters {
  year: number;
  semester: SemesterNumber;
  activeStudents: number;
  directTeachingHours: number;
  replacementTeachingHours: number;
  electiveSubjects: number;
  electiveSections: number;
  specializedCourses: number;
  specializedSections: number;
  internalTuitionScholarshipStudents: number;
  internalTuitionScholarshipCoverage: number;
  maintenanceScholarshipStudents: number;
  maintenanceScholarshipMonths: number;
  notes?: string;
}

export interface CohortDiscount {
  id: string;
  name: string;
  percentage: number;
  students: number;
  startYear: number;
  startSemester: SemesterNumber;
  endYear: number;
  endSemester: SemesterNumber;
  note?: string;
}

export interface ExternalIncome {
  id: string;
  type: "Beca ANID" | "Otra beca externa" | "Convenio" | "Aporte institucional" | "Proyecto" | "Donación" | "Ingreso extraordinario" | "Otro";
  description: string;
  year: number;
  semester: SemesterNumber;
  students: number;
  amountPerStudent: number;
  source: string;
  note?: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  description: string;
  category: "Honorarios académicos" | "Honorarios no académicos" | "Dirección" | "Asistencia" | "Gastos operacionales" | "Software" | "Difusión" | "Congresos" | "Pasantías" | "Becas de manutención" | "Bienes y servicios" | "Otros";
  year: number;
  semester?: SemesterNumber;
  amount: number;
  costType: "Propio de la cohorte" | "Compartido";
  periodicity: "Único" | "Semestral" | "Anual";
  note?: string;
}

export interface CohortBudget {
  id: string;
  program: Program;
  cohortName: string;
  startYear: number;
  startSemester: SemesterNumber;
  durationSemesters: number;
  initialStudents: number;
  status: BudgetStatus;
  facultyOverheadRate: number;
  enrollmentRecognitionRate: number;
  authorizedInitialCarryover: number;
  responsible: string;
  version: number;
  createdAt: string;
  notes?: string;
  semesters: SemesterParameters[];
  discounts: CohortDiscount[];
  externalIncome: ExternalIncome[];
  manualItems: BudgetItem[];
}

export interface AnnualFlow {
  year: number;
  activeSemesters: number;
  tuitionFactor: number;
  grossTuition: number;
  discounts: number;
  internalTuitionScholarships: number;
  tuitionAfterBenefits: number;
  badDebt: number;
  netTuitionIncome: number;
  recognizedEnrollmentFee: number;
  externalIncome: number;
  otherIncome: number;
  totalIncome: number;
  academicHonoraria: number;
  nonAcademicHonoraria: number;
  direction: number;
  assistance: number;
  operational: number;
  software: number;
  diffusion: number;
  maintenanceScholarships: number;
  congressesInternships: number;
  otherCosts: number;
  centralOverhead: number;
  facultyOverhead: number;
  totalExpenses: number;
  netFlow: number;
  startingCarryover: number;
  accumulatedFlow: number;
  thesisStudents: number;
}

export interface BudgetResult {
  periods: Array<{ year: number; semester: SemesterNumber; index: number }>;
  years: number[];
  annualFlows: AnnualFlow[];
  finalAccumulatedFlow: number;
  viable: boolean | null;
  worstDeficitYear: number | null;
  breakEvenYear: number | null;
  warnings: string[];
}
