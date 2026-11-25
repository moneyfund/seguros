import test from 'node:test';import assert from 'node:assert/strict';import {parseCirculation} from '../src/circulationParser.ts';
test('labelled synthetic card',()=>assert.deepEqual(parseCirculation('PLACA MT 12345\nMARCA TOYOTA MODELO HILUX\nAÑO 2020\nCOLOR BLANCO\nVIN JTDBW933001078225\nUSO PARTICULAR'),{plate:'MT12345',make:'Toyota',model:'Hilux',year:'2020',color:'BLANCO',vin:'JTDBW933001078225',use:'Particular'}));
test('legacy comma separated and chassis',()=>assert.deepEqual(parseCirculation('PLACA M 99999\nMOTOCICLETA, HONLEI, HL125-5\nCOLOR ROJO\nMOTOR ABC12345\nCHASIS ABC-12345\nEMISIÓN 01/01/2025'),{plate:'M99999',make:'HONLEI',model:'HL125-5',color:'ROJO',vin:'ABC-12345'}));
test('do not invent year, owner or VIN from motor',()=>assert.deepEqual(parseCirculation('PROPIETARIO PERSONA FICTICIA\nMOTOR 123456789\nEMISIÓN 2025\nVIN ABC\nPLACA ?'),{}));
test('missing values never consume next label',()=>assert.deepEqual(parseCirculation('MARCA\nMODELO\nCOLOR\nAÑO 9999'),{}));
