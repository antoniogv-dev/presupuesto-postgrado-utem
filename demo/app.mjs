import { calculateBudget, consolidateBudgets, createDemoBudget, formatCLP, getActivePeriods, parameters, syncSemesters } from './engine.mjs';

const STORAGE_KEY = 'utem-postgrado-demo-static';
const PROGRAMS_KEY = 'utem-postgrado-program-tuitions';
let budget = loadBudget();
let programCatalog = loadPrograms();
let activeView = 'dashboard';

function loadBudget() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createDemoBudget(); }
  catch { return createDemoBudget(); }
}

function defaultPrograms() {
  return [
    { ...clone(budget.program), faculty: 'Facultad de Administración y Economía', director: 'Leonardo Gatica' },
    { id: 'docmip', code: 'DOCMIP', name: 'Doctorado en Ciencias de Materiales e Ingeniería de Procesos', type: 'DOCTORADO', faculty: 'FCNMMA', director: 'Abdoulaye Thiam', annualTuition: { ...parameters.annualTuition }, tuitionSource: 'PLANTILLA_DOCTORADO' },
    { id: 'mq', code: 'MQ', name: 'Magíster en Química', type: 'MAGISTER_ACADEMICO', faculty: 'FCNMMA', director: 'Katherine Paredes', annualTuition: { ...parameters.annualTuition }, tuitionSource: 'PROPIO' },
    { id: 'mees', code: 'MEES', name: 'Magíster en Eficiencia Energética y Sustentabilidad', type: 'MAGISTER_PROFESIONAL', faculty: 'Facultad de Ingeniería', director: 'Siva Avudaiappan', annualTuition: { 2026: 4150000, 2027: 4357500, 2028: 4575375, 2029: 4804144, 2030: 5044351 }, tuitionSource: 'PROPIO' },
  ];
}

function loadPrograms() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRAMS_KEY));
    if (Array.isArray(saved) && saved.length) {
      const mgp = saved.find((program) => program.id === budget.program.id);
      if (mgp) budget.program = clone(mgp);
      return saved;
    }
  } catch { /* conserva catálogo inicial */ }
  return defaultPrograms();
}

function savePrograms() {
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programCatalog));
}

function clone(value) { return structuredClone(value); }
function percent(value) { return `${Math.round(value * 100)} %`; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }

const secondBudget = (() => {
  const next = createDemoBudget();
  next.id = 'mgp-2026-2';
  next.cohortName = 'Cohorte 2026 · Segundo semestre';
  next.startYear = 2026;
  next.startSemester = 2;
  next.initialStudents = 12;
  next.status = 'Aprobado';
  next.version = 3;
  next.discounts = [];
  next.externalIncome = [];
  next.manualItems = [];
  syncSemesters(next);
  next.semesters.forEach((semester, index) => { semester.activeStudents = 12 - Math.floor(index / 2); });
  return next;
})();

function navigate(view) {
  activeView = view;
  document.querySelectorAll('[data-view]').forEach((link) => link.classList.toggle('active', link.dataset.view === view));
  render();
  document.querySelector('#main')?.focus();
  document.body.classList.remove('menu-open');
}

function render() {
  const main = document.querySelector('#main');
  const titles = {
    dashboard: ['Panel general', 'Control presupuestario de postgrado', 'Visión ejecutiva de programas, cohortes, viabilidad y costos compartidos.'],
    budgets: ['Presupuestos', 'Formulación de cohorte', 'Edite parámetros, revise validaciones y analice el flujo financiero completo.'],
    consolidated: ['Consolidado institucional', 'Flujo total combinado', 'Integración anual con normalización de costos compartidos por programa.'],
    parameters: ['Configuración institucional', 'Parámetros generales', 'Valores transversales utilizados por el motor financiero.'],
    programs: ['Maestro institucional', 'Programas de postgrado', 'Aranceles anuales propios por programa y referencia de plantilla doctoral.'],
  };
  const [eyebrow, title, description] = titles[activeView];
  main.innerHTML = `<header class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>${activeView === 'dashboard' ? '<button class="button primary" data-action="new-budget">Nuevo presupuesto</button>' : ''}</header><div id="view-content"></div>`;
  if (activeView === 'dashboard') renderDashboard();
  if (activeView === 'budgets') renderBudget();
  if (activeView === 'consolidated') renderConsolidated();
  if (activeView === 'parameters') renderParameters();
  if (activeView === 'programs') renderPrograms();
  bindEvents();
}

function renderDashboard() {
  const result = calculateBudget(budget);
  const consolidated = consolidateBudgets([budget, secondBudget]);
  const avoided = consolidated.reduce((acc, row) => acc + row.duplicateAvoided, 0);
  document.querySelector('#view-content').innerHTML = `
    <section class="kpi-grid" aria-label="Indicadores principales">
      ${kpi('Programas configurados', String(programCatalog.length), 'Doctorados y magísteres')}
      ${kpi('Presupuestos activos', '2', '1 borrador · 1 aprobado')}
      ${kpi('Resultado cohorte 2027', formatCLP(result.finalAccumulatedFlow), result.viable ? 'Viable al cierre' : 'Requiere ajuste', result.finalAccumulatedFlow >= 0 ? 'positive' : 'negative')}
      ${kpi('Duplicidad evitada', formatCLP(avoided), 'Costos compartidos normalizados', 'positive')}
    </section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-title"><div><h2>Presupuestos recientes</h2><p>Seguimiento de versiones y estado.</p></div><button class="link-button" data-action="go-budgets">Abrir editor</button></div>
      ${budgetTable([budget, secondBudget])}</section>
      <aside class="panel"><div class="panel-title"><div><h2>Alertas de gestión</h2><p>Controles prioritarios.</p></div></div><div class="alerts"><article><i class="warning"></i><div><strong>Validar costos compartidos 2028</strong><p>Dos cohortes coinciden en el periodo.</p></div></article><article><i class="info"></i><div><strong>Versión en borrador</strong><p>La cohorte 2027 no ha sido enviada a revisión.</p></div></article><article><i class="success"></i><div><strong>Incobrabilidad consistente</strong><p>No aparece duplicada como egreso.</p></div></article></div></aside>
    </div>
    <section class="panel"><div class="panel-title"><div><h2>Consolidado por año</h2><p>Ingresos, egresos y duplicidad evitada.</p></div><button class="link-button" data-action="go-consolidated">Abrir consolidado</button></div>${consolidatedTable(consolidated)}</section>`;
}

function renderBudget() {
  const result = calculateBudget(budget);
  document.querySelector('#view-content').innerHTML = `
    <div class="actionbar"><div><span class="badge ${budget.status === 'Aprobado' ? 'approved' : ''}">${budget.status}</span><span>Versión ${budget.version}</span></div><div><button class="button secondary" data-action="reset">Restaurar</button><button class="button primary" data-action="save">Guardar borrador</button></div></div>
    <div id="message" aria-live="polite"></div>
    ${section('1', 'Identificación', 'Definición de la cohorte, periodo activo y estado de trabajo.', identificationForm(result))}
    ${section('2', 'Parámetros aplicables', 'Parámetros institucionales informativos y particulares editables.', parametersBlock(result))}
    ${section('3', 'Estudiantes y parámetros semestrales', 'Las horas, becas y cantidades pueden cambiar por semestre.', semesterTable(result))}
    ${section('4', 'Descuentos, becas e ingresos extraordinarios', 'Beneficios asociados a grupos y periodos concretos.', benefitsBlock())}
    ${section('5', 'Costos y gastos', 'Costos automáticos y partidas manuales.', costsBlock())}
    ${section('6', 'Resumen financiero', 'Resultado consolidado y viabilidad de la cohorte.', summaryBlock(result))}
    ${section('7', 'Flujo de caja anual', 'Último bloque del presupuesto: ingresos, egresos, arrastre y acumulado.', flowTable(result))}`;
}

function renderConsolidated() {
  const rows = consolidateBudgets([budget, secondBudget]);
  const income = rows.reduce((a, r) => a + r.grossIncome, 0);
  const expenses = rows.reduce((a, r) => a + r.normalizedExpenses, 0);
  const avoided = rows.reduce((a, r) => a + r.duplicateAvoided, 0);
  document.querySelector('#view-content').innerHTML = `<section class="kpi-grid">${kpi('Ingresos consolidados', formatCLP(income), 'Horizonte visible')}${kpi('Egresos normalizados', formatCLP(expenses), 'Sin duplicidades')}${kpi('Duplicidad evitada', formatCLP(avoided), 'Dirección, asistencia, operacionales y software', 'positive')}${kpi('Resultado neto', formatCLP(income - expenses), 'Flujo consolidado', income - expenses >= 0 ? 'positive' : 'negative')}</section><section class="panel">${consolidatedTable(rows)}</section><section class="panel"><div class="panel-title"><div><h2>Regla aplicada</h2><p>No duplicidad de costos compartidos.</p></div></div><div class="rule-grid"><div><strong>Clave</strong><p>Programa + año + tipo de costo.</p></div><div><strong>Categorías</strong><p>Dirección, asistencia, operacionales y software.</p></div><div><strong>Criterio inicial</strong><p>Se conserva el mayor monto anual.</p></div></div></section>`;
}

function renderPrograms() {
  const years = [2027, 2028, 2029, 2030];
  const typeLabels = { DOCTORADO: 'Doctorado', MAGISTER_ACADEMICO: 'Magíster académico', MAGISTER_PROFESIONAL: 'Magíster profesional' };
  document.querySelector('#view-content').innerHTML = `<div id="message" aria-live="polite"></div><section class="panel"><div class="panel-title"><div><h2>Arancel por programa</h2><p>Los cambios se guardan en este navegador y se aplican al presupuesto MGP de demostración.</p></div></div><div class="table-wrap"><table class="program-tuition-table"><caption class="sr-only">Arancel anual personalizado por programa</caption><thead><tr><th>Programa</th><th>Tipo</th>${years.map((year)=>`<th class="num">${year}</th>`).join('')}<th>Fuente</th><th>Acción</th></tr></thead><tbody>${programCatalog.map((program)=>`<tr><th><strong>${program.code}</strong><small>${program.name}</small></th><td>${typeLabels[program.type] || program.type}</td>${years.map((year)=>`<td><input class="tuition-table-input" aria-label="Arancel ${program.code} ${year}" type="number" min="0" step="1000" data-program-tuition="${program.id}" data-program-year="${year}" value="${program.annualTuition?.[year] ?? valueForYear(parameters.annualTuition,year)}"></td>`).join('')}<td>${program.tuitionSource === 'PLANTILLA_DOCTORADO' ? 'Plantilla doctorado' : 'Propio'}</td><td><button class="link-button" data-program-template="${program.id}">Copiar plantilla</button></td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderParameters() {
  const years = Object.keys(parameters.annualTuition).map(Number);
  const rows = [
    ['Hora docente directa', parameters.teachingHour], ['Plantilla arancel doctorado', parameters.annualTuition], ['Matrícula anual', parameters.annualEnrollmentFee], ['Dirección anual', parameters.annualDirection], ['Asistencia anual', parameters.annualAssistance], ['Gastos operacionales', parameters.referenceOperational], ['Software y licencias', parameters.softwareLicenses], ['Difusión y admisión', parameters.diffusionAdmission],
  ];
  document.querySelector('#view-content').innerHTML = `<section class="panel"><div class="parameter-grid">${param('Overhead central', percent(parameters.centralOverheadRate), 'Base: ingreso neto')}${param('Overhead facultad', percent(parameters.facultyOverheadRate), 'Editable por cohorte')}${param('Incobrabilidad', percent(parameters.badDebtRate), 'Después de beneficios')}${param('Revisión de tesis', formatCLP(parameters.thesisReviewPerStudent), 'Por tesista / año')}</div></section><section class="panel"><div class="panel-title"><div><h2>Valores anuales</h2><p>Montos en pesos chilenos.</p></div></div><div class="table-wrap"><table><thead><tr><th>Parámetro</th>${years.map((y) => `<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map(([name, values]) => `<tr><th>${name}</th>${years.map((y) => `<td class="num">${formatCLP(values[y] || 0)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}

function kpi(label, value, detail, tone = '') { return `<article class="kpi ${tone}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></article>`; }
function param(label, value, detail) { return `<div class="param"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`; }
function section(number, title, description, body) { return `<section class="panel"><div class="section-head"><div><span>${number}</span><h2>${title}</h2></div><p>${description}</p></div>${body}</section>`; }

function identificationForm(result) {
  return `<div class="form-grid"><label>Programa<input disabled value="MGP · Magíster en Gestión de Personas"></label><label>Cohorte<input data-field="cohortName" value="${budget.cohortName}"></label><label>Año de ingreso<input type="number" min="2020" max="2100" data-field="startYear" value="${budget.startYear}"></label><label>Semestre<select data-field="startSemester"><option value="1" ${budget.startSemester === 1 ? 'selected' : ''}>Primer semestre</option><option value="2" ${budget.startSemester === 2 ? 'selected' : ''}>Segundo semestre</option></select></label><label>Duración<select data-field="durationSemesters">${[2,3,4,5,6,7,8].map((v) => `<option value="${v}" ${budget.durationSemesters === v ? 'selected' : ''}>${v} semestres</option>`).join('')}</select></label><label>Estudiantes iniciales<input type="number" min="0" data-field="initialStudents" value="${budget.initialStudents}"></label><label>Estado<select data-field="status">${['Borrador','En revisión','Observado','Aprobado'].map((v) => `<option ${budget.status === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><div class="periods"><strong>Periodos activos</strong>${result.periods.map((p) => `<span>${p.year}-${p.semester}</span>`).join('')}</div>`;
}

function parametersBlock(result) {
  return `<div class="parameter-grid">${param('Overhead central', percent(parameters.centralOverheadRate), 'Institucional')}<label class="param editable"><span>Overhead facultad</span><select data-field="facultyOverheadRate"><option value="0" ${budget.facultyOverheadRate === 0 ? 'selected' : ''}>0 %</option><option value="0.05" ${budget.facultyOverheadRate === .05 ? 'selected' : ''}>5 %</option><option value="0.1" ${budget.facultyOverheadRate === .1 ? 'selected' : ''}>10 %</option></select><small>Particular</small></label>${param('Incobrabilidad', percent(parameters.badDebtRate), 'Institucional')}<label class="param editable"><span>Reconocimiento matrícula</span><select data-field="enrollmentRecognitionRate">${[0,.25,.5,.75,1].map((v) => `<option value="${v}" ${budget.enrollmentRecognitionRate === v ? 'selected' : ''}>${percent(v)}</option>`).join('')}</select><small>Particular</small></label><label class="param editable"><span>Arrastre inicial</span><input type="number" data-field="authorizedInitialCarryover" value="${budget.authorizedInitialCarryover}"><small>Autorizado</small></label>${param('Revisión de tesis', formatCLP(parameters.thesisReviewPerStudent), 'Honorarios no académicos')}</div><div class="tuition-panel"><header><div><h3>Arancel propio del programa</h3><small>Prevalece sobre la plantilla de doctorado y se aplica al cálculo de arancel, descuentos y becas.</small></div><button class="link-button" data-action="tuition-template">Usar plantilla doctorado</button></header><div class="parameter-grid tuition-grid">${result.years.map((year)=>`<label class="param editable"><span>Arancel anual ${year}</span><input type="number" min="0" step="1000" data-tuition-year="${year}" value="${budget.program.annualTuition?.[year] ?? parameters.annualTuition[year] ?? 0}"><small>${budget.program.tuitionSource === 'PLANTILLA_DOCTORADO' ? 'Basado en plantilla doctorado' : 'Personalizado para el programa'}</small></label>`).join('')}</div></div>`;
}

function semesterTable(result) {
  return `<div class="table-wrap"><table class="editable-table"><thead><tr><th>Periodo</th><th>Estudiantes</th><th>Horas directas</th><th>Horas reemplazo</th><th>Beca arancel</th><th>Cobertura</th><th>Beca mantención</th><th>Meses</th></tr></thead><tbody>${budget.semesters.map((s, i) => `<tr><th>${s.year}-${s.semester}</th>${inputCell(i,'activeStudents',s.activeStudents,'Estudiantes')}${inputCell(i,'directTeachingHours',s.directTeachingHours,'Horas directas')}${inputCell(i,'replacementTeachingHours',s.replacementTeachingHours,'Horas reemplazo')}${inputCell(i,'internalTuitionScholarshipStudents',s.internalTuitionScholarshipStudents,'Beca arancel')}${inputCell(i,'internalTuitionScholarshipCoverage',s.internalTuitionScholarshipCoverage,'Cobertura','0.1')}${inputCell(i,'maintenanceScholarshipStudents',s.maintenanceScholarshipStudents,'Beca mantención')}${inputCell(i,'maintenanceScholarshipMonths',s.maintenanceScholarshipMonths,'Meses')}</tr>`).join('')}</tbody></table></div>${result.warnings.length ? `<div class="notice warning"><strong>Validaciones pendientes</strong><ul>${result.warnings.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : ''}`;
}
function inputCell(index, field, value, label, step='1') { return `<td><input aria-label="${label} ${budget.semesters[index].year}-${budget.semesters[index].semester}" type="number" min="0" step="${step}" data-semester="${index}" data-semester-field="${field}" value="${value}"></td>`; }

function benefitsBlock() { return `<div class="split"><article class="subpanel"><header><h3>Descuentos vigentes</h3><button class="link-button">Agregar descuento</button></header>${budget.discounts.map((d) => `<div class="record"><div><strong>${d.name}</strong><span>${d.students} estudiantes · ${percent(d.percentage)}</span></div><span>${d.startYear}-${d.startSemester} a ${d.endYear}-${d.endSemester}</span></div>`).join('')}</article><article class="subpanel"><header><h3>Ingresos extraordinarios</h3><button class="link-button">Agregar ingreso</button></header>${budget.externalIncome.map((i) => `<div class="record"><div><strong>${i.description}</strong><span>${i.type}</span></div><span>${formatCLP(i.students * i.amountPerStudent)} · ${i.year}-${i.semester}</span></div>`).join('')}</article></div>`; }
function costsBlock() { return `<div class="table-wrap"><table><thead><tr><th>Partida</th><th>Categoría</th><th>Año</th><th class="num">Monto</th></tr></thead><tbody>${budget.manualItems.map((i) => `<tr><td><strong>${i.name}</strong></td><td>${i.category}</td><td>${i.year}</td><td class="num">${formatCLP(i.amount)}</td></tr>`).join('')}</tbody></table></div>`; }
function summaryBlock(result) { const income = result.annualFlows.reduce((a,f)=>a+f.totalIncome,0); const expenses=result.annualFlows.reduce((a,f)=>a+f.totalExpenses,0); return `<div class="summary-grid"><div><span>Ingreso total</span><strong>${formatCLP(income)}</strong></div><div><span>Egreso total</span><strong>${formatCLP(expenses)}</strong></div><div class="${result.finalAccumulatedFlow >= 0 ? 'good' : 'bad'}"><span>Flujo acumulado final</span><strong>${formatCLP(result.finalAccumulatedFlow)}</strong></div><div><span>Viabilidad profesional</span><strong>${result.viable ? 'Viable' : 'No viable'}</strong></div></div>`; }

function flowTable(result) {
  const rows = [
    ['Arancel bruto','grossTuition'],['Descuentos','discounts',-1],['Becas internas de arancel','internalTuitionScholarships',-1],['Arancel después de beneficios','tuitionAfterBenefits'],['Incobrables','badDebt',-1],['Ingreso neto por arancel','netTuitionIncome','emphasis'],['Matrícula reconocida','recognizedEnrollmentFee'],['Becas externas y convenios','externalIncome'],['TOTAL INGRESOS','totalIncome','total'],['Honorarios académicos','academicHonoraria',-1],['Honorarios no académicos','nonAcademicHonoraria',-1],['Dirección','direction',-1],['Asistencia','assistance',-1],['Gastos operacionales','operational',-1],['Software y difusión',null,-1],['Becas de manutención','maintenanceScholarships',-1],['Overhead central','centralOverhead',-1],['Overhead facultad','facultyOverhead',-1],['TOTAL EGRESOS','totalExpenses','total-negative'],['Flujo neto anual','netFlow','signed'],['Arrastre al inicio','startingCarryover'],['FLUJO TOTAL ACUMULADO','accumulatedFlow','total-signed']
  ];
  return `<div class="table-wrap"><table class="flow"><thead><tr><th>Concepto</th>${result.years.map((y)=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,key,mode])=>{const values=result.annualFlows.map((f)=>key ? f[key] : f.software+f.diffusion); const factor=mode===-1||mode==='total-negative'?-1:1; const cls=String(mode||'').replace('-negative','').replace('-signed',' total signed'); return `<tr class="${cls}"><th>${label}</th>${values.map((v)=>`<td class="num ${(mode==='signed'||mode==='total-signed')?(v>=0?'positive':'negative'):''}">${formatCLP(v*factor)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;
}

function budgetTable(budgets) { return `<div class="table-wrap"><table><thead><tr><th>Programa y cohorte</th><th>Periodo</th><th>Estado</th><th>Versión</th><th class="num">Resultado</th></tr></thead><tbody>${budgets.map((b)=>{const r=calculateBudget(b); return `<tr><td><strong>${b.program.code}</strong><small>${b.cohortName}</small></td><td>${b.startYear}-${b.startSemester} · ${b.durationSemesters} sem.</td><td><span class="badge ${b.status==='Aprobado'?'approved':''}">${b.status}</span></td><td>v${b.version}</td><td class="num ${r.finalAccumulatedFlow>=0?'positive':'negative'}">${formatCLP(r.finalAccumulatedFlow)}</td></tr>`}).join('')}</tbody></table></div>`; }
function consolidatedTable(rows) { return `<div class="table-wrap"><table><thead><tr><th>Año</th><th class="num">Ingresos</th><th class="num">Egresos brutos</th><th class="num">Duplicidad evitada</th><th class="num">Flujo normalizado</th></tr></thead><tbody>${rows.map((r)=>`<tr><th>${r.year}</th><td class="num">${formatCLP(r.grossIncome)}</td><td class="num">${formatCLP(r.grossExpenses)}</td><td class="num positive">${formatCLP(r.duplicateAvoided)}</td><td class="num ${r.netFlow>=0?'positive':'negative'}">${formatCLP(r.netFlow)}</td></tr>`).join('')}</tbody></table></div>`; }

function bindEvents() {
  document.querySelectorAll('[data-action="go-budgets"],[data-action="new-budget"]').forEach((el)=>el.addEventListener('click',()=>navigate('budgets')));
  document.querySelectorAll('[data-action="go-consolidated"]').forEach((el)=>el.addEventListener('click',()=>navigate('consolidated')));
  document.querySelectorAll('[data-field]').forEach((input)=>input.addEventListener('change',(event)=>{
    const field=event.target.dataset.field;
    const numeric=['startYear','startSemester','durationSemesters','initialStudents','facultyOverheadRate','enrollmentRecognitionRate','authorizedInitialCarryover'].includes(field);
    budget[field]=numeric?number(event.target.value):event.target.value;
    if(['startYear','startSemester','durationSemesters','initialStudents'].includes(field)) syncSemesters(budget);
    render();
  }));
  document.querySelectorAll('[data-semester]').forEach((input)=>input.addEventListener('change',(event)=>{
    const index=number(event.target.dataset.semester); const field=event.target.dataset.semesterField; budget.semesters[index][field]=number(event.target.value); render();
  }));
  document.querySelectorAll('[data-program-tuition]').forEach((input)=>input.addEventListener('change',(event)=>{
    const programId=event.target.dataset.programTuition; const year=number(event.target.dataset.programYear);
    programCatalog=programCatalog.map((program)=>program.id===programId?{...program,tuitionSource:'PROPIO',annualTuition:{...(program.annualTuition||{}),[year]:Math.max(0,number(event.target.value))}}:program);
    const selected=programCatalog.find((program)=>program.id===budget.program.id); if(selected) budget.program=clone(selected);
    savePrograms(); render();
  }));
  document.querySelectorAll('[data-program-template]').forEach((button)=>button.addEventListener('click',(event)=>{
    const programId=event.currentTarget.dataset.programTemplate;
    programCatalog=programCatalog.map((program)=>program.id===programId?{...program,tuitionSource:'PLANTILLA_DOCTORADO',annualTuition:{...parameters.annualTuition}}:program);
    const selected=programCatalog.find((program)=>program.id===budget.program.id); if(selected) budget.program=clone(selected);
    savePrograms(); render(); showMessage('Se copió la plantilla de arancel de doctorado.');
  }));
  document.querySelectorAll('[data-tuition-year]').forEach((input)=>input.addEventListener('change',(event)=>{
    const year=number(event.target.dataset.tuitionYear);
    budget.program.annualTuition={...(budget.program.annualTuition||{}),[year]:Math.max(0,number(event.target.value))};
    budget.program.tuitionSource='PROPIO';
    programCatalog=programCatalog.map((program)=>program.id===budget.program.id?clone(budget.program):program); savePrograms();
    render();
  }));
  document.querySelector('[data-action="tuition-template"]')?.addEventListener('click',()=>{
    const years=getActiveYears(getActivePeriods(budget.startYear,budget.startSemester,budget.durationSemesters));
    budget.program.annualTuition=Object.fromEntries(years.map((year)=>[year,valueForYear(parameters.annualTuition,year)]));
    budget.program.tuitionSource='PLANTILLA_DOCTORADO';
    programCatalog=programCatalog.map((program)=>program.id===budget.program.id?clone(budget.program):program); savePrograms();
    render(); showMessage('Se aplicó la plantilla de arancel de doctorado.');
  });
  document.querySelector('[data-action="save"]')?.addEventListener('click',()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(budget)); showMessage('Borrador guardado correctamente en este navegador.');});
  document.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY); budget=createDemoBudget(); const selected=programCatalog.find((program)=>program.id===budget.program.id); if(selected) budget.program=clone(selected); render(); showMessage('Se restauraron los datos de demostración.');});
}

function showMessage(text) { const el=document.querySelector('#message'); if(el){el.innerHTML=`<div class="notice success">${text}</div>`; setTimeout(()=>{if(el)el.innerHTML='';},3000);} }

document.querySelectorAll('[data-view]').forEach((link)=>link.addEventListener('click',(event)=>{event.preventDefault();navigate(link.dataset.view);}));
document.querySelector('#menu-open').addEventListener('click',()=>document.body.classList.add('menu-open'));
document.querySelector('#menu-close').addEventListener('click',()=>document.body.classList.remove('menu-open'));
document.querySelector('#backdrop').addEventListener('click',()=>document.body.classList.remove('menu-open'));
render();
