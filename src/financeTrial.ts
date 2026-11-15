import {doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {db,companyId} from './firebase';
import {dateOnly,validatePayment} from './operationMath';
const root='companies/'+companyId;
const trialRef=doc(db,root,'settings','enterpriseTrial');
const commissionRef=(id:string)=>doc(db,root,'commissions',id);
export type Payment={id:string;amountCents:number;date:string;reference:string;recordedBy:string};
export async function createTrialCommission(user:User,input:{policyId:string;cutId:string;periodStart:string;periodEnd:string;amountCents:number}){
 const cut=input.cutId.trim();
 if(!/^[A-Za-z0-9_-]{1,50}$/.test(cut)||!input.policyId||dateOnly(input.periodStart)===null||dateOnly(input.periodEnd)===null||input.periodEnd<input.periodStart||!Number.isSafeInteger(input.amountCents)||input.amountCents<1||input.amountCents>1000000000)throw Error('Revisa el identificador del corte, período e importe.');
 const id='trial-'+input.policyId+'-'+cut;
 await runTransaction(db,async tx=>{
  const flag=await tx.get(trialRef);
  const policy=await tx.get(doc(db,root,'enterpriseIssuance',input.policyId));
  const existing=await tx.get(commissionRef(id));
  if(flag.data()?.enabled!==true)throw Error('Habilita el modo de pruebas desde Clientes.');
  const p=policy.data();
  if(!p||p.trial!==true||p.status!=='ISSUED'||!p.pdf||!p.agentUid||!p.insurerId||!['USD','NIO'].includes(p.currency))throw Error('Selecciona una póliza de prueba emitida.');
  if(existing.exists())throw Error('Ya existe un registro para esa póliza y corte.');
  tx.set(commissionRef(id),{trial:true,source:'MANUAL_TRIAL',agentUid:p.agentUid,policyId:policy.id,policyNumber:p.policyNumber,insurerId:p.insurerId,cutId:cut,periodStart:input.periodStart,periodEnd:input.periodEnd,currency:p.currency,amountCents:input.amountCents,paidCents:0,payments:[],createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 });
}
export async function registerTrialPayment(user:User,id:string,input:{amountCents:number;date:string;reference:string}){
 const reference=input.reference.trim();if(dateOnly(input.date)===null||!reference||reference.length>120)throw Error('Indica fecha y referencia del pago.');
 const payment:Payment={id:crypto.randomUUID(),amountCents:input.amountCents,date:input.date,reference,recordedBy:user.uid};
 await runTransaction(db,async tx=>{
  const flag=await tx.get(trialRef),snap=await tx.get(commissionRef(id)),r=snap.data();
  if(flag.data()?.enabled!==true)throw Error('El modo de pruebas está desactivado.');
  if(!r||r.trial!==true||r.source!=='MANUAL_TRIAL'||!Array.isArray(r.payments))throw Error('Registro no habilitado para pagos de prueba.');
  if(r.payments.length>=100)throw Error('Se alcanzó el límite de movimientos de esta prueba.');
  const paid=validatePayment(r.amountCents,r.paidCents,input.amountCents);
  tx.update(commissionRef(id),{paidCents:paid,payments:[...r.payments,payment],updatedAt:serverTimestamp()});
 });
}
