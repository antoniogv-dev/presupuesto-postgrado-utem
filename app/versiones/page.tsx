import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

const versions = [
  { version: 3, status: "Aprobado", date: "29-07-2026", user: "Dirección de Postgrado", change: "Aprobación de flujo consolidado y costos normalizados." },
  { version: 2, status: "Observado", date: "27-07-2026", user: "UGAF", change: "Observación sobre arrastre y duplicidad de costos compartidos." },
  { version: 1, status: "Borrador", date: "22-07-2026", user: "M. Antonio Gutiérrez Varas", change: "Creación inicial de la cohorte y parámetros semestrales." },
];

export default function VersionsPage() {
  return <AppShell><PageHeader eyebrow="Trazabilidad" title="Versiones y aprobaciones" description="Historial inmutable, comparación de cambios y circuito de revisión institucional." actions={<button className="button primary">Enviar a revisión</button>} />
    <section className="panel"><div className="panel-title"><div><h2>MGP · Cohorte 2026-2</h2><p>Historial de versiones registradas.</p></div><button className="button secondary">Comparar versiones</button></div><div className="timeline">{versions.map((entry) => <article key={entry.version}><div className="timeline-marker">v{entry.version}</div><div className="timeline-content"><div><StatusBadge status={entry.status} /><time>{entry.date}</time></div><h3>{entry.change}</h3><p>Registrado por {entry.user}</p></div></article>)}</div></section>
    <section className="panel"><div className="panel-title"><div><h2>Reglas de control</h2><p>Protecciones aplicadas a presupuestos aprobados.</p></div></div><div className="explanation-grid"><div><strong>Versión aprobada inmutable</strong><p>No puede modificarse directamente.</p></div><div><strong>Nueva versión obligatoria</strong><p>Cualquier ajuste genera una copia trazable.</p></div><div><strong>Auditoría de campos</strong><p>Usuario, fecha, valor anterior y valor nuevo.</p></div></div></section>
  </AppShell>;
}
