import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mandatoryVehicleDocuments,missingDocumentKinds,validateIssuanceTransition} from '../src/issuanceWorkflow.ts';
const docs=[...mandatoryVehicleDocuments];
const submission={from:'DRAFT',to:'SUBMITTED',actor:'AGENT',expectedRevision:0,currentRevision:0,requiredKinds:docs,verifiedKinds:docs};
test('agent can submit a complete request; all sides are separate',()=>{
  assert.equal(validateIssuanceTransition(submission),1);
  assert.deepEqual(missingDocumentKinds(docs,docs.slice(1)),['IDENTITY_FRONT']);
  assert.throws(()=>validateIssuanceTransition({...submission,verifiedKinds:docs.slice(0,2)}),/REQUIRED_DOCUMENTS_MISSING/);
  assert.throws(()=>validateIssuanceTransition({...submission,requiredKinds:[]}),/REQUIREMENTS_NOT_CONFIGURED/);
});
test('agent cannot issue; operator must return reason or original PDF',()=>{
  const review={...submission,from:'IN_REVIEW',to:'ISSUED',actor:'OPERATOR'};
  assert.throws(()=>validateIssuanceTransition({...review,actor:'AGENT'}),/TRANSITION_NOT_ALLOWED/);
  assert.throws(()=>validateIssuanceTransition(review),/ORIGINAL_POLICY_PDF_REQUIRED/);
  assert.equal(validateIssuanceTransition({...review,verifiedKinds:[...docs,'ISSUED_POLICY_PDF']}),1);
  assert.throws(()=>validateIssuanceTransition({...review,to:'NEEDS_CORRECTION'}),/REASON_REQUIRED/);
  assert.equal(validateIssuanceTransition({...review,to:'NEEDS_CORRECTION',reason:'Falta legibilidad'}),1);
});
test('stale revision and duplicate emission are rejected',()=>{
  assert.throws(()=>validateIssuanceTransition({...submission,currentRevision:1}),/REVISION_CONFLICT/);
  assert.throws(()=>validateIssuanceTransition({...submission,from:'ISSUED',to:'ISSUED',actor:'OPERATOR'}),/TRANSITION_NOT_ALLOWED/);
});
