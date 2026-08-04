import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { consolidateBudgets } from "@/lib/calculations/consolidation";
import { formatCLP } from "@/lib/calculations/currency";
import { demoBudget, institutionalParameters, secondDemoBudget } from "@/lib/demo-data";

export default function ConsolidatedPage() {
  const rows = consolidateBudgets([demoBudget, secondDemoBudget], institutionalParameters);
  const income = rows.reduce((acc, row) => acc + row.grossIncome, 0);
  const normalizedExpenses = rows.reduce((acc, row) => acc + row.normalizedExpenses, 0);
  const avoided = rows.reduce((acc, row) => acc + row.duplicateAvoided, 0);
  return <AppShell><PageHeader eyebrow="Consolidado institucional" title="Flujo total combinado" description="Integración anual de cohortes con normalización de costos compartidos por programa." actions={<button className="button secondary">Exportar consolidado</button>} />
    <section className="kpi-grid"><KpiCard label="Ingresos consolidados" value={formatCLP(income)} detail="Total del horizonte visible" /><KpiCard label="Egresos normalizados" value={formatCLP(normalizedExpenses)} detail="Después de eliminar duplicidades" /><KpiCard label="Duplicidad evitada" value={formatCLP(avoided)} detail="Dirección, asistencia, operacionales y software" tone="positive" /><KpiCard label="Resultado neto" value={formatCLP(income-normalizedExpenses)} detail="Flujo consolidado" tone={income-normalizedExpenses >= 0 ? "positive" : "negative"} /></section>
    <section className="panel"><div className="filter-bar"><label>Programa<select><option>Todos los programas</option><option>MGP</option></select></label><label>Tipo<select><option>Todos los tipos</option><option>Magíster profesional</option></select></label><label>Año<select><option>Todo el horizonte</option>{rows.map((row) => <option key={row.year}>{row.year}</option>)}</select></label><label>Estado<select><option>Todos</option><option>Aprobado</option><option>Borrador</option></select></label></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Año</th><th className="numeric">Ingresos</th><th className="numeric">Egresos brutos</th><th className="numeric">Costos normalizados</th><th className="numeric">Duplicidad evitada</th><th className="numeric">Flujo neto</th></tr></thead><tbody>{rows.map((row) => <tr key={row.year}><th>{row.year}</th><td className="numeric">{formatCLP(row.grossIncome)}</td><td className="numeric">{formatCLP(row.grossExpenses)}</td><td className="numeric">{formatCLP(row.normalizedExpenses)}</td><td className="numeric positive-text">{formatCLP(row.duplicateAvoided)}</td><td className={`numeric ${row.netFlow >= 0 ? "positive-text" : "negative-text"}`}>{formatCLP(row.netFlow)}</td></tr>)}</tbody></table></div></section>
    <section className="panel"><div className="panel-title"><div><h2>Regla aplicada</h2><p>No duplicidad de costos compartidos.</p></div></div><div className="explanation-grid"><div><strong>Clave de normalización</strong><p>Programa + año + tipo de costo compartido.</p></div><div><strong>Categorías incluidas</strong><p>Dirección, asistencia, gastos operacionales y software.</p></div><div><strong>Criterio inicial</strong><p>Se conserva el mayor monto anual por programa y categoría.</p></div></div></section>
  </AppShell>;
}
