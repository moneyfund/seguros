/**
 * Seed a separately versioned fictitious brokerage portfolio.
 * Uses the names of SIBOIF-listed insurers as catalogue references only.
 * This does not issue, retrieve, update or sync actual insurance policies.
 */
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { companyId, db } from './firebase';
import { insurerById, nicaraguanInsurers } from './insurers';

export async function seedInsurancePortfolio(user: User):Promise<boolean> {
  if(!user.emailVerified)throw new Error('Iniciá sesión con una cuenta verificada.');
  const reference=(kind:string,id:string)=>doc(db,'companies',companyId,kind,id);
  const marker=reference('pilotMeta','insurerPortfolioV2');
  return runTransaction(db,async tx=>{
    const existing=await tx.get(marker);
    if(existing.exists())return false;
    const now=serverTimestamp();
    const date=(offset:number)=>{
      const day=new Date();
      day.setUTCHours(12,0,0,0);
      day.setUTCDate(day.getUTCDate()+offset);
      return day.toISOString().slice(0,10);
    };
    const cases=[
      {customer:'Cliente Demo · Alba',city:'Matagalpa',product:'Seguro vehicular',insurer:'assa',premium:620,rate:15,expires:22,source:'Referido'},
      {customer:'Cliente Demo · Bruno',city:'Managua',product:'Seguro de vida',insurer:'iniser',premium:890,rate:12,expires:63,source:'Web'},
      {customer:'Cliente Demo · Camila',city:'Estelí',product:'Seguro de hogar',insurer:'america',premium:540,rate:13,expires:89,source:'WhatsApp'},
      {customer:'Cliente Demo · Diego',city:'Jinotega',product:'Seguro empresarial',insurer:'lafise',premium:1850,rate:14,expires:145,source:'Referido'},
      {customer:'Cliente Demo · Elena',city:'Matagalpa',product:'Seguro de salud',insurer:'mapfre',premium:1350,rate:16,expires:287,source:'Redes sociales'},
      {customer:'Cliente Demo · Fabio',city:'Masaya',product:'Seguro vehicular',insurer:'mapfre',premium:770,rate:15,expires:-8,source:'Web'}
    ] as const;
    cases.forEach((item,index)=>{
      const seq=String(index+1).padStart(2,'0');
      const client=reference('pilotClients','ins-demo-client-'+seq);
      const lead=reference('pilotLeads','ins-demo-lead-'+seq);
      const policy=reference('pilotPolicies','ins-demo-policy-'+seq);
      const commission=reference('pilotCommissions','ins-demo-commission-'+seq);
      const insurer=insurerById(item.insurer)!;
      tx.set(client,{isPilot:true,fullName:item.customer,
        email:'demo'+seq+'@example.invalid',phone:'0000 0000',
        city:item.city+' (ejemplo)',status:'Activo',createdBy:user.uid,createdAt:now});
      tx.set(lead,{isPilot:true,clientId:client.id,product:item.product,
        insurerId:insurer.id,estimatedPremium:item.premium,source:item.source,
        status:'Ganado',assignedTo:user.uid,createdBy:user.uid,createdAt:now});
      tx.set(policy,{isPilot:true,clientId:client.id,leadId:lead.id,
        policyNumber:'ACOS-DEMO-'+String(index+1).padStart(4,'0'),
        insurerId:insurer.id,insurerRegistryId:insurer.registryId,
        insurer:insurer.displayName,product:item.product,premium:item.premium,
        startDate:date(item.expires-365),endDate:date(item.expires),
        commissionRate:item.rate,status:'Vigente',createdBy:user.uid,createdAt:now});
      tx.set(commission,{isPilot:true,clientId:client.id,
        policyId:policy.id,base:item.premium,rate:item.rate,
        amount:Math.round(item.premium*item.rate)/100,status:'Pendiente',
        createdBy:user.uid,createdAt:now});
    });
    tx.set(reference('pilotLeads','ins-demo-lead-pending'),{
      isPilot:true,clientId:'ins-demo-client-01',product:'Seguro empresarial',
      insurerId:'iniser',estimatedPremium:2200,source:'Web',
      status:'Cotización',assignedTo:user.uid,createdBy:user.uid,createdAt:now
    });
    const tickets=[
      {clientId:'ins-demo-client-01',subject:'Consulta sobre renovación vehicular',detail:'Caso ficticio: solicitar propuesta de renovación.',status:'Pendiente'},
      {clientId:'ins-demo-client-03',subject:'Actualización de beneficiarios',detail:'Caso ficticio: revisar documentos de cobertura.',status:'En proceso'},
      {clientId:'ins-demo-client-06',subject:'Seguimiento de vigencia vencida',detail:'Caso ficticio: programar próxima gestión de renovación.',status:'Pendiente'}
    ] as const;
    tickets.forEach((item,i)=>tx.set(reference('pilotTickets','ins-demo-ticket-'+(i+1)),{
      isPilot:true,...item,createdBy:user.uid,createdAt:now
    }));
    tx.set(doc(collection(db,'companies',companyId,'pilotActivities')),{
      isPilot:true,clientId:'ins-demo-client-01',
      label:'Cartera ficticia con cinco aseguradoras cargada',category:'catalogo',
      actorEmail:user.email||'Dirección',createdBy:user.uid,createdAt:now
    });
    tx.set(marker,{isPilot:true,seedVersion:2,insurerCount:nicaraguanInsurers.length,
      createdBy:user.uid,createdAt:now});
    return true;
  });
}
