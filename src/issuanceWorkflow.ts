/**
 * Pure workflow invariants, shared by future trusted backend and UI.
 * This module cannot authorize a database operation by itself.
 * All identity, tenant, roles, ownership and attachment checks must be
 * established by trusted server code in the same transaction.
 */
export const mandatoryVehicleDocuments = [
  'IDENTITY_FRONT', 'IDENTITY_BACK', 'VEHICLE_REGISTRATION'
] as const;
export type IssuanceStatus = 'DRAFT'|'SUBMITTED'|'IN_REVIEW'|'NEEDS_CORRECTION'|'ISSUED'|'REJECTED'|'CANCELLED';
export type WorkflowActor = 'AGENT'|'OPERATOR';
export interface Transition {
  from: IssuanceStatus;
  to: IssuanceStatus;
  actor: WorkflowActor;
  expectedRevision: number;
  currentRevision: number;
  requiredKinds: readonly string[];
  verifiedKinds: readonly string[];
  reason?: string;
}
const transitions: Record<IssuanceStatus, Partial<Record<IssuanceStatus,WorkflowActor>>> = {
  DRAFT:{SUBMITTED:'AGENT',CANCELLED:'AGENT'},
  SUBMITTED:{IN_REVIEW:'OPERATOR'},
  IN_REVIEW:{NEEDS_CORRECTION:'OPERATOR',ISSUED:'OPERATOR',REJECTED:'OPERATOR'},
  NEEDS_CORRECTION:{SUBMITTED:'AGENT',CANCELLED:'AGENT'},
  ISSUED:{},REJECTED:{},CANCELLED:{}
};
export function missingDocumentKinds(required: readonly string[], verified: readonly string[]): string[] {
  const present=new Set(verified);
  return [...new Set(required)].filter(kind=>!present.has(kind));
}
export function validateIssuanceTransition(input:Transition):number {
  if(!Number.isSafeInteger(input.currentRevision)||input.currentRevision<0||
      input.currentRevision!==input.expectedRevision) throw new Error('REVISION_CONFLICT');
  if(transitions[input.from]?.[input.to]!==input.actor) throw new Error('TRANSITION_NOT_ALLOWED');
  if(input.to==='SUBMITTED') {
    if(!input.requiredKinds.length) throw new Error('REQUIREMENTS_NOT_CONFIGURED');
    if(missingDocumentKinds(input.requiredKinds,input.verifiedKinds).length) throw new Error('REQUIRED_DOCUMENTS_MISSING');
  }
  if((input.to==='NEEDS_CORRECTION'||input.to==='REJECTED')&&!input.reason?.trim()) throw new Error('REASON_REQUIRED');
  if(input.to==='ISSUED'&&!input.verifiedKinds.includes('ISSUED_POLICY_PDF')) throw new Error('ORIGINAL_POLICY_PDF_REQUIRED');
  return input.currentRevision+1;
}
