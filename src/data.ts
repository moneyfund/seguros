export type Role = 'direccion' | 'ventas' | 'operaciones' | 'servicio' | 'finanzas' | 'supervision' | 'cliente';
export type Section = 'resumen' | 'prospectos' | 'polizas' | 'clientes' | 'solicitudes' | 'finanzas' | 'equipo' | 'documentos' | 'configuracion';
export type LeadStatus = 'Nuevo' | 'Contactado' | 'Cotización' | 'Negociación' | 'Ganado';
export interface Lead { id: string; name: string; product: string; value: number; assignee: string; status: LeadStatus; date: string; channel: string; }
export interface Policy { id: string; client: string; insurer: string; product: string; premium: number; commission: number; end: string; status: 'Vigente' | 'Por renovar' | 'En emisión' | 'Vencida'; }
export interface Ticket { id: string; customer: string; topic: string; type: string; priority: 'Alta' | 'Media' | 'Baja'; status: 'Pendiente' | 'En proceso' | 'Resuelto'; time: string; }
export interface Commission { id: string; company: string; policy: string; agent: string; base: number; rate: number; amount: number; status: 'Conciliada' | 'Pendiente' | 'Por revisar'; }
export interface DemoFile { name: string; type: string; owner: string; date: string; size: string; }
export const money = (n: number) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export const roles: {id:Role;label:string;short:string;description:string;}[] = [
  {id:'direccion',label:'Dirección general',short:'Dirección',description:'Visión integral y control estratégico'},
  {id:'ventas',label:'Comercial y ventas',short:'Comercial',description:'Prospectos y nuevas oportunidades'},
  {id:'operaciones',label:'Operaciones y pólizas',short:'Operaciones',description:'Emisiones, vigencias y renovaciones'},
  {id:'servicio',label:'Servicio al cliente',short:'Servicio',description:'Solicitudes y acompañamiento'},
  {id:'finanzas',label:'Finanzas y comisiones',short:'Finanzas',description:'Conciliación y rentabilidad'},
  {id:'supervision',label:'Supervisión de área',short:'Supervisión',description:'Rendimiento y seguimiento de equipo'},
  {id:'cliente',label:'Portal del asegurado',short:'Cliente',description:'Mis pólizas y solicitudes'}
];
export const navigationByRole: Record<Role,Section[]> = {
  direccion:['resumen','prospectos','polizas','clientes','solicitudes','finanzas','equipo','documentos','configuracion'],
  ventas:['resumen','prospectos','clientes','polizas','documentos'],
  operaciones:['resumen','polizas','clientes','documentos','solicitudes'],
  servicio:['resumen','solicitudes','clientes','polizas','documentos'],
  finanzas:['resumen','finanzas','polizas','documentos'],
  supervision:['resumen','prospectos','clientes','equipo','solicitudes','documentos'],
  cliente:['resumen','polizas','solicitudes','documentos']
};
export const initialLeads: Lead[] = [
  {id:'OP-1049',name:'María López',product:'Seguro de vida',value:840,assignee:'Valeria Morales',status:'Negociación',date:'07 nov 2026',channel:'Referido'},
  {id:'OP-1048',name:'Carlos Mendoza',product:'Seguro vehicular',value:620,assignee:'Andrés García',status:'Cotización',date:'07 nov 2026',channel:'Web'},
  {id:'OP-1047',name:'Sofía Rivas',product:'Seguro médico',value:1380,assignee:'Valeria Morales',status:'Contactado',date:'06 nov 2026',channel:'WhatsApp'},
  {id:'OP-1046',name:'Daniel Cruz',product:'Seguro empresarial',value:2400,assignee:'Natalia Ruiz',status:'Nuevo',date:'06 nov 2026',channel:'Referido'},
  {id:'OP-1045',name:'Ana Rodríguez',product:'Seguro de hogar',value:540,assignee:'Andrés García',status:'Ganado',date:'05 nov 2026',channel:'Web'},
  {id:'OP-1044',name:'José Pérez',product:'Seguro vehicular',value:760,assignee:'Natalia Ruiz',status:'Cotización',date:'04 nov 2026',channel:'Redes'},
  {id:'OP-1043',name:'Lucía Herrera',product:'Seguro de vida',value:960,assignee:'Valeria Morales',status:'Nuevo',date:'04 nov 2026',channel:'WhatsApp'}
];
export const initialPolicies: Policy[] = [
  {id:'POL-260184',client:'María López',insurer:'Aseguradora 01',product:'Vida individual',premium:840,commission:126,end:'12 dic 2026',status:'Por renovar'},
  {id:'POL-260183',client:'Carlos Mendoza',insurer:'Aseguradora 02',product:'Automóvil',premium:620,commission:93,end:'21 nov 2026',status:'Por renovar'},
  {id:'POL-260182',client:'Sofía Rivas',insurer:'Aseguradora 01',product:'Gastos médicos',premium:1380,commission:207,end:'18 abr 2027',status:'Vigente'},
  {id:'POL-260181',client:'Daniel Cruz',insurer:'Aseguradora 03',product:'Empresarial',premium:2400,commission:360,end:'03 jun 2027',status:'En emisión'},
  {id:'POL-260180',client:'Ana Rodríguez',insurer:'Aseguradora 02',product:'Hogar',premium:540,commission:81,end:'14 ago 2027',status:'Vigente'},
  {id:'POL-260179',client:'José Pérez',insurer:'Aseguradora 03',product:'Automóvil',premium:760,commission:114,end:'20 oct 2026',status:'Vencida'}
];
export const initialTickets: Ticket[] = [
  {id:'CS-2084',customer:'Carlos Mendoza',topic:'Consulta sobre cobertura de vehículo',type:'Consulta',priority:'Alta',status:'Pendiente',time:'Hace 18 min'},
  {id:'CS-2083',customer:'Sofía Rivas',topic:'Solicitud de modificación de beneficiario',type:'Modificación',priority:'Media',status:'En proceso',time:'Hace 1 h'},
  {id:'CS-2082',customer:'Ana Rodríguez',topic:'Entrega de documento actualizado',type:'Documentación',priority:'Baja',status:'Pendiente',time:'Ayer'},
  {id:'CS-2081',customer:'María López',topic:'Seguimiento de siniestro reportado',type:'Siniestro',priority:'Alta',status:'En proceso',time:'Ayer'}
];
export const initialCommissions: Commission[] = [
  {id:'CM-001',company:'Aseguradora 01',policy:'POL-260184',agent:'Valeria Morales',base:840,rate:15,amount:126,status:'Conciliada'},
  {id:'CM-002',company:'Aseguradora 02',policy:'POL-260183',agent:'Andrés García',base:620,rate:15,amount:93,status:'Pendiente'},
  {id:'CM-003',company:'Aseguradora 01',policy:'POL-260182',agent:'Valeria Morales',base:1380,rate:15,amount:207,status:'Conciliada'},
  {id:'CM-004',company:'Aseguradora 03',policy:'POL-260181',agent:'Natalia Ruiz',base:2400,rate:15,amount:360,status:'Por revisar'},
  {id:'CM-005',company:'Aseguradora 02',policy:'POL-260180',agent:'Andrés García',base:540,rate:15,amount:81,status:'Pendiente'}
];
export const initialDocuments: DemoFile[] = [
  {name:'Póliza de automóvil.pdf',type:'Póliza',owner:'Carlos Mendoza',date:'07 nov 2026',size:'2.4 MB'},
  {name:'Solicitud de cobertura.pdf',type:'Formulario',owner:'Sofía Rivas',date:'06 nov 2026',size:'1.1 MB'},
  {name:'Identificación verificada.pdf',type:'Identidad',owner:'Ana Rodríguez',date:'05 nov 2026',size:'845 KB'},
  {name:'Cotización empresarial.pdf',type:'Cotización',owner:'Daniel Cruz',date:'04 nov 2026',size:'1.8 MB'}
];
export const team = [
  {name:'Valeria Morales',role:'Agente comercial',area:'Comercial',code:'AGE-001',status:'Activo',sales:14,initials:'VM'},
  {name:'Andrés García',role:'Agente comercial',area:'Comercial',code:'AGE-002',status:'Activo',sales:11,initials:'AG'},
  {name:'Natalia Ruiz',role:'Supervisora comercial',area:'Comercial',code:'SUP-001',status:'Activo',sales:18,initials:'NR'},
  {name:'Mateo Salinas',role:'Analista de pólizas',area:'Operaciones',code:'OPE-001',status:'Activo',sales:0,initials:'MS'},
  {name:'Elena Duarte',role:'Atención al asegurado',area:'Servicio',code:'SER-001',status:'Activo',sales:0,initials:'ED'},
  {name:'Ricardo Flores',role:'Analista financiero',area:'Finanzas',code:'FIN-001',status:'Activo',sales:0,initials:'RF'}
];
