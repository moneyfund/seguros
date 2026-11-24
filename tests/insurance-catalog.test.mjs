import test from 'node:test';
import assert from 'node:assert/strict';
import {insuranceCatalog,catalogGroups,searchCatalog,productById} from '../src/insuranceCatalog.ts';
test('22 commercial product types have unique keys, original labels and valid groups',()=>{
 assert.equal(insuranceCatalog.length,22);
 assert.equal(new Set(insuranceCatalog.map(p=>p.id)).size,22);
 assert.equal(new Set(insuranceCatalog.map(p=>p.name)).size,22);
 for(const p of insuranceCatalog){assert.ok(p.topics.length>=3);assert.ok(p.audiences.length);assert.ok(catalogGroups.some(g=>g.id===p.group));assert.ok(p.name.length<=100);}
});
test('reference aliases resolve without duplicate products',()=>{
 for(const [q,id] of [['SOAT','VEHICLE_MANDATORY'],['daños propios','AUTO'],['CAR','CONSTRUCTION_CAR'],['EAR','ERECTION_EAR'],['TREC','EQUIPMENT_TREC'],['micro-seguro','SME'],['Vida Ley','LABOR_LIFE'],['SCTR','LABOR_RISK'],['D&O','DIRECTORS_DO'],['E&O','PROFESSIONAL_EO'],['cibernetico','CYBER'],['carta fianza','SURETY']]) assert.ok(searchCatalog(q).some(p=>p.id===id),q);
});
test('audiences, category and search compose',()=>{
 assert.ok(searchCatalog('','personas').every(p=>p.audiences.includes('personas')));
 assert.ok(searchCatalog('','empresas').every(p=>p.audiences.includes('empresas')));
 assert.deepEqual(searchCatalog('montaje','empresas','ingenieria').map(p=>p.id),['ERECTION_EAR']);
 assert.equal(searchCatalog('montaje','personas','ingenieria').length,0);
 assert.equal(searchCatalog('producto inexistente').length,0);
});
test('only the existing mandatory vehicle workflow is enabled by catalog metadata',()=>{
 assert.deepEqual(insuranceCatalog.filter(p=>p.flow==='vehicle-mandatory').map(p=>p.id),['VEHICLE_MANDATORY']);
 assert.equal(productById('VEHICLE_MANDATORY').name,'Seguro obligatorio vehicular (SOA)');
 assert.equal(productById('not-a-product'),undefined);
});
