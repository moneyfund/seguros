/**
 * ACOS authorization policy core.
 *
 * Trusted-server helper only. The caller MUST verify a Firebase ID token and
 * fetch membership, role grants, overrides and departments from SQL Connect
 * with privileged credentials. NEVER accept these objects from the browser.
 * No API endpoint currently exposes this policy or private SQL data.
 *
 * This evaluates grants; it does not replace SQL tenant joins, document rules,
 * transaction validation, append-only audit persistence or account revocation.
 */
const VALID_SCOPES = new Set(['OWN', 'ASSIGNED', 'DEPARTMENT', 'COMPANY']);

function denied(reason, auditRequired) {
  return { allowed: false, reason, auditRequired };
}

function matchesScope(scope, memberId, assignments, resource) {
  if (!VALID_SCOPES.has(scope)) return false;
  if (scope === 'COMPANY') return true;
  if (scope === 'OWN') return resource.ownerMemberId === memberId;
  if (scope === 'ASSIGNED') {
    return resource.ownerMemberId === memberId ||
      (Array.isArray(resource.assignedMemberIds) && resource.assignedMemberIds.includes(memberId));
  }
  return typeof resource.departmentId === 'string' &&
    assignments.some(item => item.active === true && item.departmentId === resource.departmentId);
}

export function evaluateAccess({ identity, membership, grants = [], overrides = [], departmentAssignments = [], resource, permission, now = new Date() }) {
  const auditRequired = typeof permission === 'string' &&
    (permission.startsWith('mail.') || permission.startsWith('access.') || permission.startsWith('documents.'));
  if (!identity || identity.verified !== true || identity.emailVerified !== true ||
      typeof identity.uid !== 'string' || !identity.uid) {
    return denied('UNVERIFIED_IDENTITY', auditRequired);
  }
  if (!membership || membership.active !== true || membership.firebaseUid !== identity.uid ||
      !membership.memberId || !membership.companyId) {
    return denied('INACTIVE_OR_INVALID_MEMBERSHIP', auditRequired);
  }
  if (!resource || resource.companyId !== membership.companyId ||
      typeof permission !== 'string' || !permission.includes('.')) {
    return denied('INVALID_RESOURCE_OR_TENANT', auditRequired);
  }

  const instant = now instanceof Date ? now.getTime() : Number.NaN;
  if (!Number.isFinite(instant)) return denied('INVALID_TIME', auditRequired);
  const activeOverrides = overrides.filter(item => item && item.permission === permission &&
    (!item.expiresAt || (Number.isFinite(Date.parse(item.expiresAt)) && Date.parse(item.expiresAt) > instant)));

  // Explicit DENY takes precedence over any role and any ALLOW.
  if (activeOverrides.some(item => item.effect === 'DENY')) {
    return denied('EXPLICIT_DENY', auditRequired);
  }

  const activeDepartmentAssignments = departmentAssignments.filter(item => item &&
    item.companyId === membership.companyId && item.memberId === membership.memberId && item.active === true);

  const candidates = [
    ...grants.filter(item => item && item.permission === permission && VALID_SCOPES.has(item.scope)),
    ...activeOverrides.filter(item => item.effect === 'ALLOW' && VALID_SCOPES.has(item.scope))
  ];

  const permitted = candidates.some(item => {
    if (item.departmentId && item.departmentId !== resource.departmentId) return false;
    return matchesScope(item.scope, membership.memberId, activeDepartmentAssignments, resource);
  });

  return permitted
    ? { allowed: true, reason: 'GRANTED', auditRequired }
    : denied('NO_MATCHING_GRANT', auditRequired);
}
