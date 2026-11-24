import {insuranceCatalog} from './insuranceCatalog';
export const publicContact={email:'',phone:'',whatsapp:'',address:''};
const ids:Record<string,string>={LIFE:'vida',HEALTH:'salud',AUTO:'vehiculos',HOME:'hogar',VEHICLE_MANDATORY:'soa',TRAVEL:'viajes',PERSONAL_ACCIDENT:'accidentes',THEFT:'robos',AGRICULTURE:'agricola',MEDICAL_EXPENSES:'gastos-medicos',SME:'micro-seguro',EQUIPMENT_TREC:'maquinarias',CARGO:'transportes',DIRECTORS_DO:'do',PROFESSIONAL_EO:'eo',FIRE:'incendios',LIABILITY:'responsabilidad',CONTRACTOR:'contratista',CONSTRUCTION_CAR:'construccion'};
export const catalogSolutions=insuranceCatalog.map(p=>({...p,id:ids[p.id],productId:p.id,shortName:p.name,headline:p.summary,description:p.summary,alt:''}));
const advisory=[
 {id:'empresas',name:'Asesoría empresarial',shortName:'Empresas',headline:'Vos hacés crecer tu negocio.',description:'Analizamos los riesgos de tu empresa para orientarte sobre las opciones disponibles.',summary:'Respaldo para lo que construís.',topics:['Actividad y activos','Responsabilidades','Protección del equipo'],image:'/images/empresas.webp',alt:'',productId:'',audiences:['empresas'] as const},
 {id:'asesoria',name:'Asesoría y acompañamiento',shortName:'Asesoría',headline:'Elegir bien empieza por entender.',description:'Te acompañamos a revisar alternativas y requisitos.',summary:'Resolvemos tus dudas.',topics:['Alternativas','Requisitos y documentos','Seguimiento'],image:'/images/asesoria.webp',alt:'',productId:'',audiences:['personas','empresas'] as const},
];
export const publicSolutions=[...catalogSolutions,...advisory];
export type SolutionId=string;
export const featuredSolutions=[
 ...['vida','vehiculos','salud','hogar'].map((id,i)=>({...catalogSolutions.find(p=>p.id===id)!,shortName:['Vida y familia','Vehículos','Salud','Hogar'][i]})),...advisory,
];
