import { z } from "zod";

const percentage = z.number().min(0).max(1);
const nonNegativeInteger = z.number().int().min(0);

export const semesterParametersSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  semester: z.union([z.literal(1), z.literal(2)]),
  activeStudents: nonNegativeInteger,
  directTeachingHours: z.number().min(0),
  replacementTeachingHours: z.number().min(0),
  electiveSubjects: nonNegativeInteger,
  electiveSections: nonNegativeInteger,
  specializedCourses: nonNegativeInteger,
  specializedSections: nonNegativeInteger,
  internalTuitionScholarshipStudents: nonNegativeInteger,
  internalTuitionScholarshipCoverage: percentage,
  maintenanceScholarshipStudents: nonNegativeInteger,
  maintenanceScholarshipMonths: z.number().int().min(0).max(12),
  notes: z.string().optional(),
});

export const cohortBudgetSchema = z.object({
  cohortName: z.string().trim().min(3, "Ingrese una identificación de cohorte."),
  startYear: z.number().int().min(2000).max(2100),
  startSemester: z.union([z.literal(1), z.literal(2)]),
  durationSemesters: z.number().int().min(2).max(8),
  initialStudents: nonNegativeInteger,
  facultyOverheadRate: percentage,
  enrollmentRecognitionRate: percentage,
  authorizedInitialCarryover: z.number().int(),
  semesters: z.array(semesterParametersSchema).min(2).max(8),
}).superRefine((budget, context) => {
  for (const [index, semester] of budget.semesters.entries()) {
    if (semester.internalTuitionScholarshipStudents > semester.activeStudents) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["semesters", index, "internalTuitionScholarshipStudents"],
        message: "Las becas de arancel superan los estudiantes activos.",
      });
    }
  }
});

export type CohortBudgetFormData = z.infer<typeof cohortBudgetSchema>;
