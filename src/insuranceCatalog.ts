/**
 * ACOS · shared commercial product catalog.
 * Stable product keys are suitable for the future SQL catalog. Neither listing a
 * product nor choosing it in a form implies an insurer has issued coverage.
 * Source inventory: Advisers public home, Personas and Empresas pages, reviewed
 * 2026-11-24. Descriptions and classification are original ACOS editorial copy.
 * No rates, insurer eligibility, legal obligations or document requirements
 * are inferred from the reference website.
 */
export type CatalogAudience = 'personas' | 'empresas';
export type CatalogGroup = 'bienestar' | 'movilidad' | 'patrimonio' | 'ingenieria' | 'responsabilidad' | 'garantias';
export const catalogGroups: {id:CatalogGroup; name:string; subtitle:string}[] = [
 {id:'bienestar',name:'Vida, salud y personas',subtitle:'Protección personal, familiar y de los equipos de trabajo'},
 {id:'movilidad',name:'Vehículos, viajes y transporte',subtitle:'Protección para cada trayecto y para la mercancía en tránsito'},
 {id:'patrimonio',name:'Hogar, negocios y patrimonio',subtitle:'Protección de inmuebles, bienes y operaciones'},
 {id:'ingenieria',name:'Ingeniería y construcción',subtitle:'Soluciones para proyectos, montaje, equipos y maquinaria'},
 {id:'responsabilidad',name:'Responsabilidad y riesgos especiales',subtitle:'Protección frente a responsabilidades y riesgos profesionales'},
 {id:'garantias',name:'Fianzas y caución',subtitle:'Garantías para compromisos contractuales'},
];
export interface InsuranceProduct {
 id:string;
 name:string;
 group:CatalogGroup;
 audiences:readonly CatalogAudience[];
 summary:string;
 topics:readonly string[];
 aliases:readonly string[];
 flow:'vehicle-mandatory'|'review';
}
const product=(id:string,name:string,group:CatalogGroup,audiences:readonly CatalogAudience[],summary:string,topics:readonly string[],aliases:readonly string[]=[],flow:InsuranceProduct['flow']='review'):InsuranceProduct=>({id,name,group,audiences,summary,topics,aliases,flow});
const P=['personas'] as const, E=['empresas'] as const, B=['personas','empresas'] as const;
export const insuranceCatalog:readonly InsuranceProduct[]=[
 product('LIFE','Seguro de vida','bienestar',P,'Planificá un respaldo económico para las personas que dependen de vos.',['Suma asegurada y beneficiarios','Alternativas de protección y vigencia','Condiciones y exclusiones'],['vida individual','vida familiar']),
 product('HEALTH','Seguro de salud','bienestar',B,'Revisá alternativas de atención médica para vos, tu familia o tu equipo.',['Red de atención y servicios','Límites, deducibles y períodos de espera','Requisitos de contratación'],['seguro médico','salud familiar','salud colectiva']),
 product('PERSONAL_ACCIDENT','Accidentes personales','bienestar',B,'Explorá opciones de respaldo económico ante lesiones accidentales.',['Actividades y exposición al riesgo','Invalidez, fallecimiento accidental y asistencias a consultar','Límites y exclusiones'],['accidentes','AP']),
 product('MEDICAL_EXPENSES','Seguro de gastos médicos','bienestar',B,'Evaluá alternativas para afrontar gastos de atención y tratamientos médicos.',['Gastos y servicios a considerar','Red médica y reembolsos','Deducibles y límites'],['gastos médicos colectivos','formación laboral']),
 product('LABOR_LIFE','Seguro de vida laboral (Vida Ley)','bienestar',E,'Analizá alternativas de protección de vida para colaboradores.',['Características del equipo','Suma asegurada y beneficiarios','Modalidades y requisitos aplicables en Nicaragua'],['vida ley','vida grupo','vida colectivo']),
 product('LABOR_RISK','Seguro de riesgos laborales (SCTR)','bienestar',E,'Revisá la protección del personal según su actividad y exposición ocupacional.',['Actividad laboral y riesgos','Accidentes y prestaciones a consultar','Modalidad y requisitos aplicables en Nicaragua'],['SCTR','trabajo de riesgo','accidentes laborales']),
 product('AUTO','Seguro vehicular','movilidad',B,'Protegé tu vehículo o flota con alternativas de daños propios y responsabilidad frente a terceros.',['Uso particular o comercial','Daños propios, robo y responsabilidad a consultar','Deducibles, límites y condiciones'],['daños propios','automóvil','flota','auto']),
 product('VEHICLE_MANDATORY','Seguro obligatorio vehicular (SOA)','movilidad',B,'Conocé las alternativas del seguro obligatorio para vehículos en circulación.',['Tipo de vehículo y circulación','Alcance de la protección obligatoria aplicable','Requisitos, límites y vigencia'],['SOA','SOAT','seguro obligatorio','responsabilidad civil obligatoria'],'vehicle-mandatory'),
 product('TRAVEL','Seguro de viajes','movilidad',P,'Prepará tu viaje con opciones de asistencia y protección según destino y duración.',['Destino y fechas','Asistencia médica y eventualidades del viaje','Límites, requisitos y exclusiones'],['asistencia al viajero','viaje']),
 product('CARGO','Seguro de transportes','movilidad',E,'Revisá soluciones para mercancías durante su traslado nacional o internacional.',['Tipo de mercancía y valor','Ruta y medio de transporte','Riesgos, límites y condiciones'],['transporte','carga','marítimo','aéreo','terrestre']),
 product('HOME','Seguro de hogar','patrimonio',P,'Cuidá tu vivienda y sus bienes con alternativas adaptadas al inmueble.',['Edificación y contenido','Riesgos del inmueble y ubicación','Valores asegurables y deducibles'],['domiciliario','vivienda']),
 product('THEFT','Seguro contra robo','patrimonio',E,'Analizá opciones frente a pérdidas y daños relacionados con robo o asalto.',['Bienes y ubicación','Medidas de seguridad','Modalidades de cobertura y exclusiones'],['robo','asalto','hurto']),
 product('MULTIRISK','Seguro multirriesgo empresarial','patrimonio',E,'Revisá en conjunto los riesgos de instalaciones, activos y operación de tu empresa.',['Inventario y valores asegurables','Riesgos de daños materiales','Alcance, deducibles y extensiones'],['multiriesgo','multirriesgo','patrimonial','empresarial']),
 product('SME','Microseguro y seguro PYME','patrimonio',E,'Explorá alternativas ajustadas a la dimensión y necesidades de tu negocio.',['Actividad y tamaño de la empresa','Activos esenciales y riesgos prioritarios','Opciones y condiciones de contratación'],['micro seguro','micro-seguro','microempresa','PYME','MIPYME']),
 product('CONSTRUCTION_CAR','Todo riesgo construcción (CAR)','ingenieria',E,'Revisá protección para obras civiles durante las distintas etapas de ejecución.',['Tipo de obra, presupuesto y cronograma','Obra, materiales y responsabilidades a consultar','Riesgos técnicos, deducibles y condiciones'],['CAR','todo riesgo de construcción','obras civiles','contratista de obra']),
 product('ERECTION_EAR','Todo riesgo montaje (EAR)','ingenieria',E,'Explorá alternativas de protección para instalación y montaje de equipos e infraestructura.',['Equipos, instalaciones y cronograma','Riesgos durante montaje y pruebas','Valores, límites y exclusiones'],['EAR','montaje','instalación']),
 product('EQUIPMENT_TREC','Todo riesgo equipo y maquinaria (TREC)','ingenieria',E,'Analizá alternativas para maquinaria y equipos utilizados en proyectos y operaciones.',['Inventario, uso y ubicación del equipo','Riesgos de operación y traslado a consultar','Valor asegurado, deducibles y exclusiones'],['TREC','seguro contratista','equipo de contratistas','maquinaria','equipo móvil']),
 product('LIABILITY','Seguro de responsabilidad civil','responsabilidad',E,'Revisá riesgos de daños a terceros derivados de las actividades de tu organización.',['Actividad y exposición frente a terceros','Daños personales y materiales a consultar','Límites, deducibles y exclusiones'],['RC','responsabilidad civil general']),
 product('DIRECTORS_DO','Seguro de directores y administradores (D&O)','responsabilidad',E,'Explorá alternativas para responsabilidades vinculadas a decisiones de gestión y dirección.',['Estructura y actividad de la empresa','Personas y funciones asegurables','Reclamaciones, límites y condiciones'],['D&O','DO','directores','administradores']),
 product('PROFESSIONAL_EO','Responsabilidad civil profesional (E&O)','responsabilidad',E,'Evaluá riesgos de reclamaciones relacionados con la prestación de servicios profesionales.',['Profesión y servicios prestados','Errores, omisiones y reclamaciones a consultar','Límites, deducibles y exclusiones'],['E&O','EO','errores y omisiones','RC profesional']),
 product('CYBER','Seguro de riesgo cibernético','responsabilidad',E,'Revisá la exposición digital de tu organización y alternativas para incidentes informáticos.',['Sistemas, información y controles','Impactos propios y responsabilidad frente a terceros','Alcance, respuesta y exclusiones'],['ciberseguridad','cibernético','cyber','riesgo digital']),
 product('SURETY','Fianzas, cartas fianza y caución','garantias',E,'Evaluá garantías para respaldar compromisos frente a entidades públicas o privadas.',['Tipo de obligación y beneficiario','Monto, vigencia y documentación a revisar','Condiciones de la garantía'],['seguro fianza','seguro de fianza','carta fianza','seguro de caución','fianza']),
];
export function normalizeCatalogText(value:string):string {
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
export function searchCatalog(query='',audience:'todos'|CatalogAudience='todos',group:CatalogGroup|'todos'='todos'):InsuranceProduct[]{
 const tokens=normalizeCatalogText(query).split(' ').filter(Boolean);
 return insuranceCatalog.filter(item=>{
  const haystack=normalizeCatalogText([item.name,item.summary,...item.aliases,...item.topics,catalogGroups.find(g=>g.id===item.group)?.name||''].join(' '));
  return (audience==='todos'||item.audiences.includes(audience))&&(group==='todos'||item.group===group)&&tokens.every(token=>haystack.includes(token));
 });
}
export function productById(id:string){return insuranceCatalog.find(item=>item.id===id);}
