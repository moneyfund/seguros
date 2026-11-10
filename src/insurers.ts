/**
 * Official insurer reference catalogue — Nicaragua.
 * SIBOIF institutional registry consulted 2026-11-10.
 * This static directory is NOT an API integration, partnership or authorization
 * to issue policies. All ACOS pilot business operations remain fictional.
 * https://siboif.gob.ni/supervision/intendencia-seguros/instituciones
 */
export interface NicaraguanInsurer {
  id: string;
  displayName: string;
  legalName: string;
  registryId: string;
  authorization: string;
  established: string;
  shortName: string;
  monogram: string;
}
export const regulatorDirectory =
  'https://siboif.gob.ni/supervision/intendencia-seguros/instituciones';
export const nicaraguanInsurers: readonly NicaraguanInsurer[] = [
  {
    id:'iniser',displayName:'INISER',legalName:'Instituto Nicaragüense de Seguros y Reaseguros (INISER)',
    registryId:'3101',authorization:'Decreto No. 107',established:'1979-10-16',
    shortName:'INISER',monogram:'IN'
  },
  {
    id:'assa',displayName:'ASSA Seguros',legalName:'ASSA, Compañía de Seguros, S.A.',
    registryId:'3102',authorization:'SIB-OIF-IV-28-96',established:'1996-12-23',
    shortName:'ASSA',monogram:'AS'
  },
  {
    id:'america',displayName:'Seguros América',legalName:'Compañía de Seguros América, S.A.',
    registryId:'3103',authorization:'SIB-OIF-IV-29-96',established:'1996-12-27',
    shortName:'América',monogram:'AM'
  },
  {
    id:'lafise',displayName:'Seguros LAFISE',legalName:'Seguros Lafise, S.A.',
    registryId:'3104',authorization:'SIB-OIF-IV-30-96',established:'1996-12-27',
    shortName:'LAFISE',monogram:'LF'
  },
  {
    id:'mapfre',displayName:'MAPFRE Nicaragua',legalName:'MAPFRE | SEGUROS NICARAGUA, S.A.',
    registryId:'3105',authorization:'SIB-OIF-V-15-97',established:'1997-03-11',
    shortName:'MAPFRE',monogram:'MF'
  }
] as const;
export function insurerById(id:string) {return nicaraguanInsurers.find(i=>i.id===id);}
export function insurerFromText(text:string) {
  const raw=text.trim().toLowerCase();
  if(raw==='aseguradora ficticia a') return undefined;
  return nicaraguanInsurers.find(i=>i.id===raw ||
    i.displayName.toLowerCase()===raw || i.legalName.toLowerCase()===raw ||
    i.shortName.toLowerCase()===raw
  );
}
