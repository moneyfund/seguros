import {canonicalVehicleMake,modelsForMake,vehicleSearchKey} from './vehicleCatalog.ts';
export type CirculationFields={plate:string;make:string;model:string;year:string;color:string;vin:string;use:string};
export type CirculationResult=Partial<CirculationFields>;
const labels=/\b(?:PLACA|MATRICULA|MARCA|MODELO|AÑO|ANO|COLOR|VIN|CHASIS|MOTOR|USO|SERVICIO|EMISION|EMISIÓN|VTO|VENCIMIENTO|PROPIETARIO|CEDULA|CÉDULA|DIRECCION|DIRECCIÓN|TIPO|CLASE|CILINDRAJE|CAPACIDAD)\b/i;
const tidy=(s:string)=>s.replace(/^[\s:;.,#–—-]+|[\s:;.,#–—-]+$/g,'').trim();
const normalize=(s:string)=>s.normalize('NFC').toUpperCase();
function labelled(lines:string[],pattern:RegExp){
 for(let i=0;i<lines.length;i++){
  const match=pattern.exec(lines[i]);if(!match)continue;
  let rest=lines[i].slice(match.index+match[0].length).replace(/^\s*[:#.-]?\s*/,'');
  if(!rest&&lines[i+1]&&!labels.test(lines[i+1]))rest=lines[i+1];
  const cut=rest.search(labels);if(cut>=0)rest=rest.slice(0,cut);
  const cleaned=tidy(rest);if(cleaned)return cleaned;
 }return '';
}
const letters=(s:string,max:number)=>s.length<=max&&/^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 /().+&'-]*$/i.test(s)?s:'';
const knownModel=(make:string,model:string)=>modelsForMake(make).find(m=>vehicleSearchKey(m)===vehicleSearchKey(model))||model;
export function parseCirculation(text:string,nowYear=new Date().getFullYear()):CirculationResult{
 const lines=normalize(text).split(/\r?\n/).map(s=>s.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
 const result:CirculationResult={};
 const plate=labelled(lines,/\b(?:PLACA|MATR[IÍ]CULA)\b(?:\s+(?:NO\.?|N[°º]))?/i).replace(/[\s-]/g,'');
 if(/^[A-Z]{1,4}\d{3,8}$/.test(plate))result.plate=plate;
 let make=labelled(lines,/\bMARCA\b/i),model=labelled(lines,/\bMODELO\b/i);
 // Circulaciones antiguas: "AUTOMOVIL, TOYOTA, YARIS" o "MOTOCICLETA, HONLEI, HL125-5".
 if(!make||!model)for(const line of lines){
  const m=line.match(/^(?:AUTOM[ÓO]VIL|MOTOCICLETA|CAMIONETA|CAMI[ÓO]N|MICROB[ÚU]S|AUTOB[ÚU]S|PICK\s*UP|JEEP|TRACTOR|FURG[ÓO]N|REMOLQUE)\s*[,;]\s*([^,;]+)\s*[,;]\s*([^,;]+?)(?:[,;]|$)/i);
  if(m){if(!make)make=tidy(m[1]);if(!model)model=tidy(m[2]);break;}
 }
 if(letters(make,60))result.make=canonicalVehicleMake(make)||make;
 if(letters(model,80))result.model=result.make?knownModel(result.make,model):model;
 const year=labelled(lines,/\b(?:AÑO|ANO)\b/i).match(/^(19\d{2}|20\d{2})\b/);
 if(year&&Number(year[1])<=nowYear+2)result.year=year[1];
 const color=labelled(lines,/\bCOLOR\b/i);
 if(letters(color,40)&&!/\d/.test(color))result.color=color;
 const vin=labelled(lines,/\bVIN\b/i).replace(/[\s-]/g,''),chassis=labelled(lines,/\bCHASIS\b/i).replace(/\s/g,'');
 if(/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))result.vin=vin;
 else if(/^[A-Z0-9-]{5,40}$/.test(chassis))result.vin=chassis;
 const use=labelled(lines,/\b(?:USO|SERVICIO)\b/i);
 const mapped:Record<string,string>={PARTICULAR:'Particular',COMERCIAL:'Comercial',TAXI:'Taxi',MOTOCICLETA:'Motocicleta',OTRO:'Otro'};
 if(mapped[use])result.use=mapped[use];
 return result;
}

export type CirculationConflict={front:string;back:string};
export function mergeCirculationSides(front:CirculationResult,back:CirculationResult){
 const fields:CirculationResult={},conflicts:Partial<Record<keyof CirculationFields,CirculationConflict>>={};
 const keys=Array.from(new Set([...Object.keys(front),...Object.keys(back)])) as (keyof CirculationFields)[];
 for(const key of keys){
  const a=front[key]?.trim(),b=back[key]?.trim();
  if(a&&b&&a.toUpperCase()!==b.toUpperCase())conflicts[key]={front:a,back:b};
  else if(a||b)fields[key]=a||b;
 }
 if(fields.make&&fields.model)fields.model=knownModel(fields.make,fields.model);
 return {fields,conflicts};
}
