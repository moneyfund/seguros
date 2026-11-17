export type TrackId='finanzas'|'seguros'|'proteccion';
export type Lesson={id:string;title:string;description:string;videoId:string;author:string;track:TrackId;source:'external'|'acos'};
export const tracks=[
 {id:'finanzas',number:'01',title:'Finanzas personales',description:'Organizá tu dinero, construí hábitos de ahorro y tomá mejores decisiones.',icon:'wallet',color:'mint'},
 {id:'seguros',number:'02',title:'El mundo de los seguros',description:'Aprendé a interpretar una póliza y a comparar alternativas con criterio.',icon:'shield',color:'gold'},
 {id:'proteccion',number:'03',title:'Protección y prevención',description:'Prepará tu familia y tu patrimonio para imprevistos.',icon:'umbrella',color:'blue'}
] as const;
export const curated:Lesson[]=[
 {id:'fdl-presupuesto',track:'finanzas',title:'Planificá tus ingresos y gastos',description:'Una introducción al presupuesto familiar.',videoId:'-Uqm2e3w7EM',author:'Financiera FDL · Nicaragua',source:'external'},
 {id:'aeb-presupuesto',track:'finanzas',title:'Tu dinero y tú: el presupuesto',description:'Organización de ingresos y gastos cotidianos.',videoId:'AsIub8Z67_k',author:'Asociación Española de Banca',source:'external'},
 {id:'fdl-credito',track:'finanzas',title:'Créditos responsables',description:'Reflexioná sobre el costo y la capacidad de pago.',videoId:'gyx5mC5lvJA',author:'Financiera FDL · Nicaragua',source:'external'},
 {id:'cnsf-seguros',track:'seguros',title:'¿Qué son los seguros?',description:'Introducción al seguro y su función de protección. Material de México; las normas locales pueden diferir.',videoId:'IJV0oTAaUUE',author:'Comisión Nacional de Seguros y Fianzas · México',source:'external'},
 {id:'fdl-metas',track:'proteccion',title:'Planificá tus metas financieras',description:'Identificá prioridades y prepará un plan.',videoId:'RcMTNdhZ_BA',author:'Financiera FDL · Nicaragua',source:'external'},
 {id:'fpt-emergencia',track:'proteccion',title:'Cómo ahorrar para el fondo de emergencias',description:'Identificá oportunidades de ahorro ante imprevistos.',videoId:'f-sq2Vrk530',author:'FinanzasParaTodos',source:'external'}
];
export type Question={prompt:string;options:string[];answer:number;explanation:string};
export const quizzes:Record<TrackId,Question[]>={
 finanzas:[
 {prompt:'Una familia recibe C$20,000 al mes y gasta C$16,500. ¿Cuál es su disponibilidad antes de otros compromisos?',options:['C$16,500','C$3,500','C$36,500'],answer:1,explanation:'La disponibilidad es ingresos menos gastos: C$3,500.'},
 {prompt:'¿Qué debe incluir un presupuesto útil?',options:['Solo compras grandes','Solo ingresos fijos','Ingresos, gastos, deudas y metas de ahorro'],answer:2,explanation:'Registrar todas las entradas y salidas permite anticipar compromisos y ajustar prioridades.'},
 {prompt:'Dos créditos tienen la misma cuota mensual, pero distintos plazos. ¿Qué conviene comparar?',options:['Costo total, plazo, comisiones y capacidad de pago','Solo la cuota','El color de la tarjeta'],answer:0,explanation:'Una cuota menor o igual no garantiza un menor costo total.'},
 {prompt:'¿Para qué sirve principalmente un fondo de emergencia?',options:['Comprar artículos de lujo','Cubrir imprevistos sin depender de deuda inmediata','Garantizar ganancias'],answer:1,explanation:'Su finalidad es disponer de dinero ante gastos o pérdida de ingresos inesperados.'},
 {prompt:'Te ofrecen una inversión con ganancia muy alta garantizada y te presionan a depositar hoy. ¿Qué hacés?',options:['Depositar antes de perder la promoción','Compartir tus claves para validar','Verificar la entidad, los riesgos y la legitimidad antes de decidir'],answer:2,explanation:'La presión y promesas de rentabilidad extraordinaria pueden ser señales de fraude.'}],
 seguros:[
 {prompt:'¿Qué es la prima de un seguro?',options:['El importe que se paga por la cobertura contratada','La cantidad que siempre se recibe al reclamar','Un impuesto idéntico para todas las pólizas'],answer:0,explanation:'La prima es el precio de la cobertura conforme al contrato.'},
 {prompt:'Una reparación cubierta cuesta C$12,000 y el deducible fijo aplicable es C$2,000. Sin otros límites, ¿qué importe corresponde a la parte cubierta?',options:['C$14,000','C$10,000','C$2,000'],answer:1,explanation:'En este supuesto simplificado, se resta el deducible de C$2,000. Las condiciones reales pueden variar.'},
 {prompt:'Una póliza incluye una exclusión expresa para cierto evento. ¿Qué significa?',options:['Que siempre lo cubre','Que la prima es gratuita','Que ese evento queda fuera de cobertura bajo esas condiciones'],answer:2,explanation:'Las exclusiones definen situaciones que el contrato no cubre.'},
 {prompt:'¿Qué conviene revisar antes de contratar?',options:['Coberturas, límites, deducibles, exclusiones y vigencia','Solo el precio','Solo el logotipo de la compañía'],answer:0,explanation:'Una comparación informada considera alcance y condiciones, no únicamente la prima.'},
 {prompt:'¿Quién determina la aceptación del riesgo y emite la póliza?',options:['Cualquier intermediario','La aseguradora, conforme a sus condiciones','El beneficiario'],answer:1,explanation:'El corredor asesora e intermedia; la compañía aseguradora emite el contrato.'}],
 proteccion:[
 {prompt:'Una persona depende de su vehículo para trabajar. ¿Qué conviene evaluar primero?',options:['Solo el valor de compra','Solo la marca','Riesgos de uso, impacto financiero y cobertura disponible'],answer:2,explanation:'Identificar el riesgo y su impacto ayuda a decidir qué protección resulta apropiada.'},
 {prompt:'¿Qué acción ayuda a evitar interrupciones de cobertura?',options:['Revisar la vigencia y gestionar la renovación con anticipación','Esperar a tener un siniestro','Suponer que se renueva siempre'],answer:0,explanation:'Las renovaciones y su aceptación deben verificarse antes de que termine la vigencia.'},
 {prompt:'¿Cómo actuar ante un siniestro?',options:['Modificar los hechos para asegurar el pago','Priorizar seguridad, documentar y avisar según la póliza','Publicar documentos personales en redes'],answer:1,explanation:'La seguridad y la información veraz son prioritarias; se deben seguir los requisitos de la aseguradora.'},
 {prompt:'¿Qué relación existe entre ahorro de emergencia y seguro?',options:['Son exactamente lo mismo','El seguro elimina la necesidad de presupuestar','Son herramientas complementarias para enfrentar distintos riesgos'],answer:2,explanation:'El ahorro ofrece liquidez; un seguro cubre eventos previstos con límites y condiciones.'},
 {prompt:'Al comparar protección para un negocio, ¿qué enfoque es más útil?',options:['Inventariar activos, responsabilidades y posibles interrupciones','Comprar cualquier póliza barata','Asumir que todas las pérdidas están cubiertas'],answer:0,explanation:'Identificar activos y riesgos permite evaluar coberturas y exclusiones relevantes.'}]
};
export function youtubeId(input:string):string|null{
 try{const u=new URL(input.trim());if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
 const host=u.hostname.toLowerCase();let id='';
 if(host==='youtu.be')id=u.pathname.split('/')[1]||'';
 else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){id=u.pathname==='/watch'?u.searchParams.get('v')||'':/^\/(embed|shorts|live)\//.test(u.pathname)?u.pathname.split('/')[2]||'':'';}
 return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
 }catch{return null;}
}
