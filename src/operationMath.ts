export function dateOnly(value:string):number|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const time=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value?time:null;
}
export function localToday(now=new Date()):string{
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Managua',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>parts.find(x=>x.type===k)?.value).join('-');
}
export function daysUntil(end:string,today:string):number|null{
 const a=dateOnly(end),b=dateOnly(today);return a===null||b===null?null:Math.round((a-b)/86400000);
}
export function policyValidity(start:string,end:string,today:string,horizon=30):'invalid'|'future'|'expired'|'due'|'active'{
 const a=daysUntil(start,today),b=daysUntil(end,today);
 if(a===null||b===null||a>b)return 'invalid';
 if(b<0)return 'expired';if(a>0)return 'future';return b<=horizon?'due':'active';
}
export function parseCents(raw:string):number{
 const v=raw.trim().replace(',','.');
 if(!/^\d{1,8}(\.\d{1,2})?$/.test(v))throw Error('Ingresa un importe positivo con hasta dos decimales.');
 const [whole,decimal='']=v.split('.');const n=Number(whole)*100+Number(decimal.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n<1||n>1000000000)throw Error('Importe fuera de rango.');return n;
}
export function validatePayment(amount:number,paid:number,addition:number){
 if(![amount,paid,addition].every(Number.isSafeInteger)||amount<1||paid<0||addition<1||paid>amount||addition>amount-paid)throw Error('El pago supera el saldo pendiente o no es válido.');
 return paid+addition;
}
