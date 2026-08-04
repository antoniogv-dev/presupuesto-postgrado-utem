import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default function AdministrationPage() {
  return <AppShell><PageHeader eyebrow="Administración" title="Usuarios, roles y reglas" description="Configuración de permisos, catálogos y parámetros de auditoría." actions={<button className="button primary">Agregar usuario</button>} />
    <div className="dashboard-grid"><section className="panel span-2"><div className="panel-title"><div><h2>Usuarios habilitados</h2><p>Acceso por rol y ámbito institucional.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Unidad</th><th>Último acceso</th><th>Estado</th></tr></thead><tbody><tr><td><strong>M. Antonio Gutiérrez Varas</strong><small>manuel.gutierrez@utem.cl</small></td><td>Gestor presupuestario</td><td>Escuela de Postgrado</td><td>Hoy, 22:18</td><td><StatusBadge status="Activo" /></td></tr><tr><td><strong>Dirección de Postgrado</strong><small>Rol institucional</small></td><td>Aprobador</td><td>Escuela de Postgrado</td><td>29-07-2026</td><td><StatusBadge status="Activo" /></td></tr></tbody></table></div></section>
    <aside className="panel"><div className="panel-title"><div><h2>Roles base</h2><p>Separación de responsabilidades.</p></div></div><div className="role-list"><div><strong>Administrador</strong><span>Configuración completa</span></div><div><strong>Gestor</strong><span>Crea y modifica borradores</span></div><div><strong>Revisor</strong><span>Observa y compara</span></div><div><strong>Aprobador</strong><span>Aprueba versiones</span></div><div><strong>Consulta</strong><span>Acceso de solo lectura</span></div></div></aside></div>
  </AppShell>;
}
