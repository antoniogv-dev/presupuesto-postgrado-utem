import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { formatCLP, formatPercent } from "@/lib/calculations/currency";
import { institutionalParameters } from "@/lib/demo-data";

export default function ParametersPage() {
  const years = Object.keys(institutionalParameters.annualTuition).map(Number);
  return <AppShell><PageHeader eyebrow="Configuración institucional" title="Parámetros generales" description="Valores transversales que alimentan el motor financiero y evitan repeticiones por cohorte." actions={<button className="button primary">Nueva vigencia</button>} />
    <section className="panel"><div className="panel-title"><div><h2>Parámetros porcentuales</h2><p>Reglas institucionales vigentes.</p></div></div><div className="parameter-grid"><div className="parameter-item"><span>Overhead central</span><strong>{formatPercent(institutionalParameters.centralOverheadRate)}</strong><small>Base: ingreso neto por arancel</small></div><div className="parameter-item"><span>Overhead facultad</span><strong>{formatPercent(institutionalParameters.facultyOverheadRate)}</strong><small>Editable por presupuesto</small></div><div className="parameter-item"><span>Incobrabilidad</span><strong>{formatPercent(institutionalParameters.badDebtRate)}</strong><small>Después de beneficios</small></div><div className="parameter-item"><span>Reajuste anual</span><strong>{formatPercent(institutionalParameters.annualAdjustmentRate)}</strong><small>Referencia de proyección</small></div></div></section>
    <section className="panel"><div className="panel-title"><div><h2>Valores anuales</h2><p>Montos institucionales. El arancel indicado corresponde a la plantilla de doctorado; cada programa puede mantener valores propios.</p></div><button className="text-button">Editar valores</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Parámetro</th>{years.map((year) => <th className="numeric" key={year}>{year}</th>)}</tr></thead><tbody>
      <ParameterRow name="Hora docente directa" years={years} values={institutionalParameters.teachingHour} />
      <ParameterRow name="Plantilla arancel doctorado" years={years} values={institutionalParameters.annualTuition} />
      <ParameterRow name="Matrícula anual" years={years} values={institutionalParameters.annualEnrollmentFee} />
      <ParameterRow name="Dirección anual" years={years} values={institutionalParameters.annualDirection} />
      <ParameterRow name="Asistencia anual" years={years} values={institutionalParameters.annualAssistance} />
      <ParameterRow name="Gastos operacionales" years={years} values={institutionalParameters.referenceOperational} />
      <ParameterRow name="Software y licencias" years={years} values={institutionalParameters.softwareLicenses} />
      <ParameterRow name="Difusión y admisión" years={years} values={institutionalParameters.diffusionAdmission} />
    </tbody></table></div></section>
    <section className="panel"><div className="panel-title"><div><h2>Valores únicos generales</h2><p>Parámetros no versionados temporalmente en esta etapa.</p></div></div><div className="parameter-grid"><div className="parameter-item"><span>Hora docente de reemplazo</span><strong>{formatCLP(institutionalParameters.replacementHour)}</strong><small>Valor único configurable</small></div><div className="parameter-item"><span>Revisión de tesis</span><strong>{formatCLP(institutionalParameters.thesisReviewPerStudent)}</strong><small>Honorarios no académicos</small></div><div className="parameter-item"><span>Horizonte de planificación</span><strong>{institutionalParameters.planningHorizonYears} años</strong><small>Vista consolidada</small></div></div></section>
  </AppShell>;
}

function ParameterRow({ name, years, values }: { name: string; years: number[]; values: Record<number, number> }) { return <tr><th>{name}</th>{years.map((year) => <td className="numeric" key={year}>{formatCLP(values[year] ?? 0)}</td>)}</tr>; }
