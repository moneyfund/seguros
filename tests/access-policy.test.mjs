import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAccess } from '../server/accessPolicy.mjs';

const identity = { uid: 'amy-uid', verified: true, emailVerified: true };
const membership = { firebaseUid: 'amy-uid', memberId: 'm1', companyId: 'acos', active: true };
const base = { identity, membership, resource: { companyId: 'acos', ownerMemberId: 'm2', departmentId: 'emisiones' }, permission: 'issuance.read' };
const run = (changes = {}) => evaluateAccess({ ...base, ...changes, now: new Date('2026-11-24T12:00:00Z') });

test('deny by default without role grants', () => {
  assert.equal(run().allowed, false);
});

test('company-scope grant allows an explicitly authorized general administrator', () => {
  assert.equal(run({ grants: [{ permission: 'issuance.read', scope: 'COMPANY' }] }).allowed, true);
});

test('general administration never depends on an email allowlist', () => {
  assert.equal(run({ identity: { ...identity, email: 'director@example.test' } }).allowed, false);
});

test('agent with OWN scope cannot read another agent record', () => {
  assert.equal(run({ grants: [{ permission: 'issuance.read', scope: 'OWN' }] }).allowed, false);
  assert.equal(run({ grants: [{ permission: 'issuance.read', scope: 'OWN' }], resource: { ...base.resource, ownerMemberId: 'm1' } }).allowed, true);
});

test('ASSIGNED scope only reaches explicit assignments', () => {
  const grants = [{ permission: 'issuance.read', scope: 'ASSIGNED' }];
  assert.equal(run({ grants }).allowed, false);
  assert.equal(run({ grants, resource: { ...base.resource, assignedMemberIds: ['m1'] } }).allowed, true);
});

test('department scope requires active matching department membership', () => {
  const grants = [{ permission: 'issuance.read', scope: 'DEPARTMENT' }];
  const dept = [{ memberId: 'm1', companyId: 'acos', departmentId: 'emisiones', active: true }];
  assert.equal(run({ grants }).allowed, false);
  assert.equal(run({ grants, departmentAssignments: dept }).allowed, true);
  assert.equal(run({ grants, departmentAssignments: dept, resource: { ...base.resource, departmentId: 'ventas' } }).allowed, false);
});

test('cross-company requests are denied regardless of broad grants', () => {
  assert.equal(run({ grants: [{ permission: 'issuance.read', scope: 'COMPANY' }], resource: { companyId: 'otra', ownerMemberId: 'm1' } }).allowed, false);
});

test('explicit DENY beats company-wide role permission', () => {
  assert.equal(run({ grants: [{ permission: 'issuance.read', scope: 'COMPANY' }], overrides: [{ permission: 'issuance.read', effect: 'DENY' }] }).allowed, false);
});

test('inactive memberships and unverified accounts have no access', () => {
  assert.equal(run({ membership: { ...membership, active: false }, grants: [{ permission: 'issuance.read', scope: 'COMPANY' }] }).allowed, false);
  assert.equal(run({ identity: { ...identity, emailVerified: false }, grants: [{ permission: 'issuance.read', scope: 'COMPANY' }] }).allowed, false);
});

test('expired ALLOW does not grant access; active override is scoped', () => {
  assert.equal(run({ overrides: [{ permission: 'issuance.read', effect: 'ALLOW', scope: 'COMPANY', expiresAt: '2026-11-24T11:00:00Z' }] }).allowed, false);
  assert.equal(run({ overrides: [{ permission: 'issuance.read', effect: 'ALLOW', scope: 'COMPANY', departmentId: 'ventas' }] }).allowed, false);
});

test('mailbox access requests always require audit, whether granted or denied', () => {
  const request = { ...base, permission: 'mail.read' };
  assert.equal(evaluateAccess({ ...request }).auditRequired, true);
  const allowed = evaluateAccess({ ...request, grants: [{ permission: 'mail.read', scope: 'COMPANY' }] });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.auditRequired, true);
});
