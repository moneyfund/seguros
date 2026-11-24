/** ACOS commercial inventory, transcribed from the current dedicated Personas and Empresas pages of Advisers, 2026-11-24.
 * 7 personal listings, 13 business listings; Vehicular is shared (19 unique products). No extra categories or products.
 * Descriptions are original ACOS advisory copy; not insurance promises or inferred legal obligations.
 */
export type CatalogAudience='personas'|'empresas';
export interface InsuranceProduct{
 id:string; name:string; audiences:readonly CatalogAudience[]; summary:string; topics:readonly string[]; image:string; flow:'vehicle-mandatory'|'review';
}
const P=['personas'] as const,E=['empresas'] as const,B=['personas','empresas'] as const;
const p=(id:string,name:string,audiences:readonly CatalogAudience[],summary:string,topics:readonly string[],image='',flow:InsuranceProduct['flow']='review'):InsuranceProduct=>({id,name,audiences,summary,topics,image,flow});
export const insuranceCatalog:readonly InsuranceProduct[]=[
 p('LIFE','Seguro de vida',P,'Protección para el futuro de las personas que más querés.',['Beneficiarios','Suma asegurada','Condiciones y vigencia'],'/images/vida.webp'),
 p('HEALTH','Seguro de salud',P,'Alternativas para cuidar tu bienestar y el de tu familia.',['Red médica','Límites y deducibles','Requisitos y exclusiones'],'/images/salud.webp'),
 p('AUTO','Seguro vehicular',B,'Respaldo para tu vehículo, tu familia o tu operación.',['Tipo y uso del vehículo','Daños y responsabilidades a consultar','Deducibles y vigencia'],'/images/vehiculos.webp'),
 p('HOME','Seguro hogar',P,'Cuidá tu vivienda y los bienes que forman parte de tu vida.',['Inmueble y contenido','Valores asegurables','Riesgos y condiciones'],'/images/hogar.webp'),
 p('VEHICLE_MANDATORY','SOA',P,'Asesoría para la protección obligatoria de tu vehículo.',['Tipo de vehículo','Alcance aplicable','Requisitos y vigencia'],'/images/vehiculos.webp','vehicle-mandatory'),
 p('TRAVEL','Seguro de viajes',P,'Prepará cada viaje con alternativas de asistencia y protección.',['Destino y duración','Asistencia a consultar','Límites y exclusiones'],'/images/vehiculos.webp'),
 p('PERSONAL_ACCIDENT','Accidentes personales',P,'Alternativas de respaldo frente a lesiones accidentales.',['Actividad y exposición','Protección accidental a consultar','Límites y exclusiones'],'/images/salud.webp'),
 p('THEFT','Seguro contra robos',E,'Revisá opciones para proteger los bienes de tu empresa.',['Bienes y ubicación','Medidas de seguridad','Condiciones y exclusiones'],'/images/empresas.webp'),
 p('AGRICULTURE','Seguro agrícola',E,'Alternativas de protección para tu actividad agrícola.',['Cultivo y ubicación','Riesgos de la actividad','Valores y condiciones']),
 p('MEDICAL_EXPENSES','Seguro gastos médicos',E,'Revisá alternativas para afrontar gastos de atención médica.',['Servicios médicos','Límites y deducibles','Requisitos'],'/images/salud.webp'),
 p('SME','Micro-Seguro',E,'Protección adaptada a las necesidades de pequeños negocios.',['Actividad comercial','Bienes y riesgos prioritarios','Condiciones'],'/images/negocio.webp'),
 p('EQUIPMENT_TREC','Seguro maquinarias',E,'Alternativas para proteger la maquinaria de tu operación.',['Inventario y ubicación','Uso y riesgos del equipo','Valores y deducibles']),
 p('CARGO','Seguro transportes',E,'Asesoría para la protección de mercancías durante su traslado.',['Mercancías y valor','Ruta y transporte','Riesgos y condiciones']),
 p('DIRECTORS_DO','Seguro D&O',E,'Revisá alternativas para responsabilidades de dirección y gestión.',['Actividad empresarial','Funciones de dirección','Reclamaciones y límites'],'/images/asesoria.webp'),
 p('PROFESSIONAL_EO','Seguro RC Profesional E&O',E,'Alternativas para riesgos derivados de servicios profesionales.',['Servicios y actividad','Errores y omisiones a consultar','Límites y condiciones'],'/images/asesoria.webp'),
 p('FIRE','Seguro incendios y líneas aliadas',E,'Revisá la protección de inmuebles y bienes frente a riesgos de daños.',['Inmueble y bienes','Riesgos a consultar','Valores y deducibles']),
 p('LIABILITY','Responsabilidad civil',E,'Asesoría frente a posibles daños a terceros en tu operación.',['Actividad y exposición','Responsabilidades a consultar','Límites y exclusiones'],'/images/empresas.webp'),
 p('CONTRACTOR','Seguro contratista',E,'Revisá opciones de protección para la actividad de contratistas.',['Actividad y contrato','Equipos y responsabilidades','Condiciones y límites']),
 p('CONSTRUCTION_CAR','Seguro todo riesgo de construcción',E,'Asesoría sobre riesgos asociados a la ejecución de obras.',['Obra y cronograma','Materiales y riesgos','Valores y condiciones']),
];
export function normalizeCatalogText(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function searchCatalog(query='',audience:'todos'|CatalogAudience='todos'){
 const tokens=normalizeCatalogText(query).split(' ').filter(Boolean);
 return insuranceCatalog.filter(p=>(audience==='todos'||p.audiences.includes(audience))&&tokens.every(t=>normalizeCatalogText(p.name).includes(t)));
}
export function productById(id:string){return insuranceCatalog.find(p=>p.id===id);}
