import test from 'node:test';
import assert from 'node:assert/strict';
import {insuranceCatalog,searchCatalog,productById} from '../src/insuranceCatalog.ts';
test('exact inventory from dedicated Advisers pages',()=>{
 assert.equal(insuranceCatalog.length,19);
 assert.equal(new Set(insuranceCatalog.map(p=>p.id)).size,19);
 assert.deepEqual(searchCatalog('','personas').map(p=>p.name),['Seguro de vida','Seguro de salud','Seguro vehicular','Seguro hogar','SOA','Seguro de viajes','Accidentes personales']);
 assert.deepEqual(searchCatalog('','empresas').map(p=>p.name),['Seguro vehicular','Seguro contra robos','Seguro agrícola','Seguro gastos médicos','Micro-Seguro','Seguro maquinarias','Seguro transportes','Seguro D&O','Seguro RC Profesional E&O','Seguro incendios y líneas aliadas','Responsabilidad civil','Seguro contratista','Seguro todo riesgo de construcción']);
 assert.deepEqual(insuranceCatalog.filter(p=>p.audiences.length===2).map(p=>p.id),['AUTO']);
});
test('search respects segment and accents, without extra products',()=>{
 assert.equal(searchCatalog('agricola','personas').length,0);
 assert.equal(searchCatalog('agricola','empresas')[0].id,'AGRICULTURE');
 assert.equal(searchCatalog('cibernetico').length,0);
 assert.equal(searchCatalog('soa')[0].id,'VEHICLE_MANDATORY');
});
test('existing specialized issuance workflow is unchanged',()=>{
 assert.deepEqual(insuranceCatalog.filter(p=>p.flow==='vehicle-mandatory').map(p=>p.id),['VEHICLE_MANDATORY']);
 assert.equal(productById('VEHICLE_MANDATORY').name,'SOA');
});
