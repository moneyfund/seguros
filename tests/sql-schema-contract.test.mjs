import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const access = readFileSync(new URL('../dataconnect/schema/organization-and-authorization.gql', import.meta.url), 'utf8');
const issuance = readFileSync(new URL('../dataconnect/schema/issuance-lifecycle.gql', import.meta.url), 'utf8');
const privateOps = readFileSync(new URL('../dataconnect/enterprise/private-operations.gql', import.meta.url), 'utf8');

test('access schema provides multi-department, scoped RBAC and an audit trail', () => {
  for (const name of ['MemberDepartment', 'AccessPermission', 'RolePermission', 'MemberPermissionOverride', 'CustomerAssignment', 'MailboxDelegation', 'AccessAuditEntry']) {
    assert.match(access, new RegExp('type ' + name + ' @table'));
  }
  assert.match(access, /type MemberDepartment @table\(key: \["member", "department"\]\)/);
  assert.match(access, /scope: String!/);
  assert.match(access, /effect: String!/);
});

test('issuance schema keeps state revisions and attachment history', () => {
  for (const name of ['InsuredVehicle', 'IssuanceDocumentRequirement', 'IssuanceRequest', 'IssuanceAttachment', 'IssuanceAttachmentVersion', 'IssuanceStatusEvent', 'IssuancePolicyLink', 'InboxNotification']) {
    assert.match(issuance, new RegExp('type ' + name + ' @table'));
  }
  assert.match(issuance, /type IssuanceStatusEvent @table @unique\(fields: \["request", "revision"\]\)/);
  assert.match(issuance, /type IssuanceAttachmentVersion @table @unique\(fields: \["request", "documentKind", "revision"\]\)/);
});

test('new database operations are admin-SDK only and never public', () => {
  const queryLines = privateOps.split('\n').filter(line => /^query\s+[A-Za-z_][A-Za-z_0-9]*/.test(line));
  assert.equal(queryLines.length, 2);
  for (const definition of queryLines) {
    assert.match(definition, /@auth\(level:\s*NO_ACCESS\)/);
    assert.doesNotMatch(definition, /@auth\(level:\s*(PUBLIC|USER|USER_ANON)\)/);
  }
});

test('new schema never seeds any personal records or default admins', () => {
  assert.doesNotMatch(access + issuance, /norvingarcia220@gmail.com|amyblandon171@gmail.com/i);
  assert.doesNotMatch(access + issuance, /createUser\(|insertInto\(/);
});
