"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { calculateBudget } from "@/lib/calculations/budget-engine";
import { formatCLP, formatPercent } from "@/lib/calculations/currency";
import { getActivePeriods } from "@/lib/calculations/periods";
import type { CohortBudget, SemesterParameters } from "@/lib/calculations/types";
import { demoBudget, institutionalParameters } from "@/lib/demo-data";

const STORAGE_KEY = "utem-postgrado-budget-demo";

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BudgetWorkspace() {
  const [budget, setBudget] = useState<CohortBudget>(demoBudget);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setBudget(JSON.parse(saved) as CohortBudget); } catch { /* conserva la demostración */ }
    }
  }, []);

  const result = useMemo(() => calculateBudget(budget, institutionalParameters), [budget]);

  function updateHeader<K extends keyof CohortBudget>(key: K, value: CohortBudget[K]) {
    setBudget((current) => {
      const next = { ...current, [key]: value };
      if (["startYear", "startSemester", "durationSemesters", "initialStudents"].includes(String(key))) {
        const periods = getActivePeriods(next.startYear, next.startSemester, next.durationSemesters);
        const existing = new Map(current.semesters.map((semester) => [`${semester.year}-${semester.semester}`, semester]));
        next.semesters = periods.map((period) => existing.get(`${period.year}-${period.semester}`) ?? {
          year: period.year,
          semester: period.semester,
          activeStudents: next.initialStudents,
          directTeachingHours: 0,
          replacementTeachingHours: 0,
          electiveSubjects: 0,
          electiveSections: 0,
          specializedCourses: 0,
          specializedSections: 0,
          internalTuitionScholarshipStudents: 0,
          internalTuitionScholarshipCoverage: 1,
          maintenanceScholarshipStudents: 0,
          maintenanceScholarshipMonths: 0,
          notes: "",
        });
      }
      return next;
    });
  }

  function updateSemester(index: number, key: keyof SemesterParameters, value: number | string) {
    setBudget((current) => ({
      ...current,
      semesters: current.semesters.map((semester, candidate) => candidate === index ? { ...semester, [key]: value } : semester),
    }));
  }

  function updateProgramTuition(year: number, amount: number) {
    setBudget((current) => ({
      ...current,
      program: {
        ...current.program,
        tuitionSource: "PROPIO",
        annualTuition: { ...(current.program.annualTuition ?? {}), [year]: Math.max(0, amount) },
      },
    }));
  }

  function applyDoctorateTuitionTemplate() {
    const activeYears = result.years;
    const values = Object.fromEntries(activeYears.map((year) => [year, institutionalParameters.annualTuition[year] ?? 0]));
    setBudget((current) => ({
      ...current,
      program: { ...current.program, tuitionSource: "PLANTILLA_DOCTORADO", annualTuition: values },
    }));
    setMessage("Se aplicó la plantilla de arancel de doctorado a los años activos.");
  }

  function saveDraft() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
    setMessage("Borrador guardado correctamente en este navegador.");
    window.setTimeout(() => setMessage(""), 3500);
  }

  function resetDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    setBudget(demoBudget);
    setMessage("Se restauraron los datos de demostración.");
  }

  const finalTone = result.finalAccumulatedFlow >= 0 ? "metric-positive" : "metric-negative";

  return (
    <div className="budget-workspace">
      <div className="sticky-actions" aria-label="Acciones del presupuesto">
        <div><StatusBadge status={budget.status} /><span>Versión {budget.version}</span></div>
        <div>
          <button className="button secondary" type="button" onClick={resetDemo}>Restaurar demostración</button>
          <button className="button primary" type="button" onClick={saveDraft}>Guardar borrador</button>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">{message}</div>
      {message ? <div className="notice success" role="status">{message}</div> : null}

      <section className="panel" aria-labelledby="identificacion-title">
        <div className="section-heading">
          <div><span className="section-number">1</span><h2 id="identificacion-title">Identificación</h2></div>
          <p>Definición de la cohorte, periodo activo y estado de trabajo.</p>
        </div>
        <div className="form-grid cols-4">
          <label>Programa<input value={`${budget.program.code} · ${budget.program.name}`} disabled /></label>
          <label>Cohorte<input value={budget.cohortName} onChange={(event) => updateHeader("cohortName", event.target.value)} /></label>
          <label>Año de ingreso<input type="number" min="2020" max="2100" value={budget.startYear} onChange={(event) => updateHeader("startYear", numberValue(event.target.value))} /></label>
          <label>Semestre de ingreso<select value={budget.startSemester} onChange={(event) => updateHeader("startSemester", numberValue(event.target.value) as 1 | 2)}><option value="1">Primer semestre</option><option value="2">Segundo semestre</option></select></label>
          <label>Duración<select value={budget.durationSemesters} onChange={(event) => updateHeader("durationSemesters", numberValue(event.target.value))}>{[2,3,4,5,6,7,8].map((value) => <option key={value} value={value}>{value} semestres</option>)}</select></label>
          <label>Estudiantes iniciales<input type="number" min="0" value={budget.initialStudents} onChange={(event) => updateHeader("initialStudents", numberValue(event.target.value))} /></label>
          <label>Estado<select value={budget.status} onChange={(event) => updateHeader("status", event.target.value as CohortBudget["status"])}>{["Borrador", "En revisión", "Observado", "Aprobado"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Responsable<input value={budget.responsible} onChange={(event) => updateHeader("responsible", event.target.value)} /></label>
        </div>
        <div className="period-strip" aria-label="Periodos activos">
          <strong>Periodos activos</strong>
          {result.periods.map((period) => <span key={`${period.year}-${period.semester}`}>{period.year}-{period.semester}</span>)}
        </div>
      </section>

      <section className="panel" aria-labelledby="parametros-title">
        <div className="section-heading">
          <div><span className="section-number">2</span><h2 id="parametros-title">Parámetros aplicables</h2></div>
          <p>Los parámetros institucionales son informativos; los particulares son editables.</p>
        </div>
        <div className="parameter-grid">
          <div className="parameter-item"><span>Overhead central</span><strong>{formatPercent(institutionalParameters.centralOverheadRate)}</strong><small>Institucional</small></div>
          <label className="parameter-item editable"><span>Overhead facultad</span><select value={budget.facultyOverheadRate} onChange={(event) => updateHeader("facultyOverheadRate", numberValue(event.target.value))}><option value="0">0 %</option><option value="0.05">5 %</option><option value="0.1">10 %</option></select><small>Editable por autorización</small></label>
          <div className="parameter-item"><span>Incobrabilidad</span><strong>{formatPercent(institutionalParameters.badDebtRate)}</strong><small>Institucional</small></div>
          <label className="parameter-item editable"><span>Reconocimiento matrícula</span><select value={budget.enrollmentRecognitionRate} onChange={(event) => updateHeader("enrollmentRecognitionRate", numberValue(event.target.value))}>{[0,0.25,0.5,0.75,1].map((value) => <option key={value} value={value}>{formatPercent(value)}</option>)}</select><small>Particular</small></label>
          <label className="parameter-item editable"><span>Arrastre inicial autorizado</span><input type="number" step="100000" value={budget.authorizedInitialCarryover} onChange={(event) => updateHeader("authorizedInitialCarryover", numberValue(event.target.value))} /><small>Particular</small></label>
          <div className="parameter-item"><span>Revisión de tesis</span><strong>{formatCLP(institutionalParameters.thesisReviewPerStudent)}</strong><small>Por tesista / año</small></div>
        </div>
        <div className="program-tuition-panel">
          <div className="subpanel-title">
            <div><h3>Arancel propio del programa</h3><small>Se utiliza en todas las cohortes del programa. La plantilla de doctorado sólo actúa como valor inicial o respaldo.</small></div>
            <button className="text-button" type="button" onClick={applyDoctorateTuitionTemplate}>Usar plantilla doctorado</button>
          </div>
          <div className="parameter-grid tuition-grid">
            {result.years.map((year) => (
              <label className="parameter-item editable" key={year}>
                <span>Arancel anual {year}</span>
                <input type="number" min="0" step="1000" value={budget.program.annualTuition?.[year] ?? institutionalParameters.annualTuition[year] ?? 0} onChange={(event) => updateProgramTuition(year, numberValue(event.target.value))} />
                <small>{budget.program.tuitionSource === "PLANTILLA_DOCTORADO" ? "Basado en plantilla doctorado" : "Personalizado para el programa"}</small>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="estudiantes-title">
        <div className="section-heading">
          <div><span className="section-number">3</span><h2 id="estudiantes-title">Estudiantes y parámetros semestrales</h2></div>
          <p>Las horas, becas y cantidades pueden cambiar en cada semestre.</p>
        </div>
        <div className="table-wrap">
          <table className="data-table editable-table">
            <caption className="sr-only">Parámetros por semestre activo</caption>
            <thead><tr><th scope="col">Periodo</th><th scope="col">Estudiantes</th><th scope="col">Horas directas</th><th scope="col">Horas reemplazo</th><th scope="col">Beca arancel</th><th scope="col">Cobertura</th><th scope="col">Beca mantención</th><th scope="col">Meses</th></tr></thead>
            <tbody>{budget.semesters.map((semester, index) => (
              <tr key={`${semester.year}-${semester.semester}`}>
                <th scope="row">{semester.year}-{semester.semester}</th>
                <td><input aria-label={`Estudiantes ${semester.year}-${semester.semester}`} type="number" min="0" value={semester.activeStudents} onChange={(event) => updateSemester(index, "activeStudents", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Horas directas ${semester.year}-${semester.semester}`} type="number" min="0" value={semester.directTeachingHours} onChange={(event) => updateSemester(index, "directTeachingHours", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Horas de reemplazo ${semester.year}-${semester.semester}`} type="number" min="0" value={semester.replacementTeachingHours} onChange={(event) => updateSemester(index, "replacementTeachingHours", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Estudiantes con beca de arancel ${semester.year}-${semester.semester}`} type="number" min="0" value={semester.internalTuitionScholarshipStudents} onChange={(event) => updateSemester(index, "internalTuitionScholarshipStudents", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Cobertura beca arancel ${semester.year}-${semester.semester}`} type="number" min="0" max="1" step="0.1" value={semester.internalTuitionScholarshipCoverage} onChange={(event) => updateSemester(index, "internalTuitionScholarshipCoverage", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Estudiantes con beca de manutención ${semester.year}-${semester.semester}`} type="number" min="0" value={semester.maintenanceScholarshipStudents} onChange={(event) => updateSemester(index, "maintenanceScholarshipStudents", numberValue(event.target.value))} /></td>
                <td><input aria-label={`Meses de beca ${semester.year}-${semester.semester}`} type="number" min="0" max="12" value={semester.maintenanceScholarshipMonths} onChange={(event) => updateSemester(index, "maintenanceScholarshipMonths", numberValue(event.target.value))} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {result.warnings.length ? <div className="notice warning" role="alert"><strong>Validaciones pendientes</strong><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
      </section>

      <section className="panel" aria-labelledby="beneficios-title">
        <div className="section-heading">
          <div><span className="section-number">4</span><h2 id="beneficios-title">Descuentos, becas e ingresos extraordinarios</h2></div>
          <p>Los beneficios se vinculan a grupos concretos y periodos definidos.</p>
        </div>
        <div className="split-grid">
          <article className="subpanel"><div className="subpanel-title"><h3>Descuentos vigentes</h3><button className="text-button" type="button">Agregar descuento</button></div>{budget.discounts.map((discount) => <div className="record-row" key={discount.id}><div><strong>{discount.name}</strong><span>{discount.students} estudiantes · {formatPercent(discount.percentage)}</span></div><span>{discount.startYear}-{discount.startSemester} a {discount.endYear}-{discount.endSemester}</span></div>)}</article>
          <article className="subpanel"><div className="subpanel-title"><h3>Ingresos extraordinarios</h3><button className="text-button" type="button">Agregar ingreso</button></div>{budget.externalIncome.map((income) => <div className="record-row" key={income.id}><div><strong>{income.description}</strong><span>{income.type} · {income.source}</span></div><span>{formatCLP(income.students * income.amountPerStudent)} · {income.year}-{income.semester}</span></div>)}</article>
        </div>
      </section>

      <section className="panel" aria-labelledby="costos-title">
        <div className="section-heading inline-action">
          <div><div><span className="section-number">5</span><h2 id="costos-title">Costos y gastos</h2></div><p>Costos automáticos y partidas agregadas manualmente, con identificación de costos compartidos.</p></div>
          <button className="button secondary" type="button">Agregar gasto o costo</button>
        </div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Partida</th><th>Categoría</th><th>Año</th><th>Tipo</th><th className="numeric">Monto</th></tr></thead><tbody>{budget.manualItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.description}</small></td><td>{item.category}</td><td>{item.year}</td><td>{item.costType}</td><td className="numeric">{formatCLP(item.amount)}</td></tr>)}</tbody></table></div>
      </section>

      <section className="panel summary-panel" aria-labelledby="resumen-title">
        <div className="section-heading">
          <div><span className="section-number">6</span><h2 id="resumen-title">Resumen financiero</h2></div>
          <p>Resultado consolidado de la cohorte y criterio de viabilidad.</p>
        </div>
        <div className="summary-grid">
          <div><span>Ingreso total del horizonte</span><strong>{formatCLP(result.annualFlows.reduce((acc, flow) => acc + flow.totalIncome, 0))}</strong></div>
          <div><span>Egreso total del horizonte</span><strong>{formatCLP(result.annualFlows.reduce((acc, flow) => acc + flow.totalExpenses, 0))}</strong></div>
          <div className={finalTone}><span>Flujo acumulado final</span><strong>{formatCLP(result.finalAccumulatedFlow)}</strong></div>
          <div><span>Viabilidad profesional</span><strong>{result.viable === null ? "Indicador informativo" : result.viable ? "Viable" : "No viable"}</strong></div>
        </div>
      </section>

      <section className="panel" aria-labelledby="flujo-title">
        <div className="section-heading">
          <div><span className="section-number">7</span><h2 id="flujo-title">Flujo de caja anual</h2></div>
          <p>Último bloque del presupuesto. Incluye ingreso neto, egresos, arrastre y acumulado.</p>
        </div>
        <div className="table-wrap financial-flow"><table className="data-table financial-table"><thead><tr><th scope="col">Concepto</th>{result.years.map((year) => <th scope="col" className="numeric" key={year}>{year}</th>)}</tr></thead><tbody>
          <FlowRow label="Arancel bruto" values={result.annualFlows.map((flow) => flow.grossTuition)} />
          <FlowRow label="Descuentos" values={result.annualFlows.map((flow) => -flow.discounts)} muted />
          <FlowRow label="Becas internas de arancel" values={result.annualFlows.map((flow) => -flow.internalTuitionScholarships)} muted />
          <FlowRow label="Arancel después de beneficios" values={result.annualFlows.map((flow) => flow.tuitionAfterBenefits)} />
          <FlowRow label="Incobrables" values={result.annualFlows.map((flow) => -flow.badDebt)} muted />
          <FlowRow label="Ingreso neto por arancel" values={result.annualFlows.map((flow) => flow.netTuitionIncome)} emphasis />
          <FlowRow label="Matrícula reconocida" values={result.annualFlows.map((flow) => flow.recognizedEnrollmentFee)} />
          <FlowRow label="Becas externas y convenios" values={result.annualFlows.map((flow) => flow.externalIncome)} />
          <FlowRow label="TOTAL INGRESOS" values={result.annualFlows.map((flow) => flow.totalIncome)} total />
          <FlowRow label="Honorarios académicos" values={result.annualFlows.map((flow) => -flow.academicHonoraria)} />
          <FlowRow label="Honorarios no académicos" values={result.annualFlows.map((flow) => -flow.nonAcademicHonoraria)} />
          <FlowRow label="Dirección" values={result.annualFlows.map((flow) => -flow.direction)} />
          <FlowRow label="Asistencia" values={result.annualFlows.map((flow) => -flow.assistance)} />
          <FlowRow label="Gastos operacionales" values={result.annualFlows.map((flow) => -flow.operational)} />
          <FlowRow label="Software y difusión" values={result.annualFlows.map((flow) => -(flow.software + flow.diffusion))} />
          <FlowRow label="Becas de manutención" values={result.annualFlows.map((flow) => -flow.maintenanceScholarships)} />
          <FlowRow label="Congresos y pasantías" values={result.annualFlows.map((flow) => -flow.congressesInternships)} />
          <FlowRow label="Overhead central" values={result.annualFlows.map((flow) => -flow.centralOverhead)} />
          <FlowRow label="Overhead facultad" values={result.annualFlows.map((flow) => -flow.facultyOverhead)} />
          <FlowRow label="TOTAL EGRESOS" values={result.annualFlows.map((flow) => -flow.totalExpenses)} total />
          <FlowRow label="Flujo neto anual" values={result.annualFlows.map((flow) => flow.netFlow)} emphasis signed />
          <FlowRow label="Arrastre al inicio del año" values={result.annualFlows.map((flow) => flow.startingCarryover)} />
          <FlowRow label="FLUJO TOTAL ACUMULADO" values={result.annualFlows.map((flow) => flow.accumulatedFlow)} total signed />
        </tbody></table></div>
      </section>
    </div>
  );
}

function FlowRow({ label, values, total = false, emphasis = false, muted = false, signed = false }: { label: string; values: number[]; total?: boolean; emphasis?: boolean; muted?: boolean; signed?: boolean }) {
  return <tr className={`${total ? "row-total" : ""} ${emphasis ? "row-emphasis" : ""} ${muted ? "row-muted" : ""}`}><th scope="row">{label}</th>{values.map((value, index) => <td key={index} className={`numeric ${signed ? (value >= 0 ? "positive-text" : "negative-text") : ""}`}>{formatCLP(value)}</td>)}</tr>;
}
