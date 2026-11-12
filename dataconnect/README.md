# ACOS · Firebase SQL Connect

This directory is the source of truth for the future Cloud SQL PostgreSQL model. It is **not yet deployed** until the actual database exists and the Firebase CLI migration succeeds.

## Proposed resources
- Firebase project: seguros-d1a86
- SQL Connect service: acos-enterprise
- Region: us-central1 (confirm with owners before provisioning)
- Cloud SQL instance: acos-enterprise-db (planned)
- Database: acos_enterprise (planned)
- Connector: enterprise

## Prerequisites
1. In Firebase console > SQL Connect, choose project seguros-d1a86. Check trial/billing and project permissions.
2. Confirm region and instance sizing and provision an instance under an authorized company billing account. Provisioning can create future charges.
3. Install Firebase CLI and authenticate as an authorized project administrator.
4. Fetch/clone the repository and run the following in the project root:
   firebase dataconnect:services:list --project seguros-d1a86
   firebase dataconnect:sql:diff --project seguros-d1a86
   firebase dataconnect:sql:migrate --project seguros-d1a86
   firebase deploy --only dataconnect --project seguros-d1a86
   firebase dataconnect:sdk:generate --project seguros-d1a86
5. Review all schema and migration prompts; **never run --force on an unreviewed migration**.
6. Audit generated connectors using Firebase's authorization review.
7. Test auth with real roles and isolated test accounts before migrating customer data.

## Security decisions
- Each database-owned business record belongs to Company; do not depend on the URL or client-supplied company IDs alone for authorization.
- AppUser.firebaseUid is the Firebase Auth identity, independent of email/domain changes.
- Members, roles, view permissions, and department association are separate relational tables.
- Financial amounts are integer cents (Int64); commission rates are basis points.
- Firebase Storage holds encrypted-at-rest file bytes. ManagedDocument retains uploader, path, relationships and status.
- The client may only call SQL Connect operations with verified per-record permissions.
- Administrative operations are set to NO_ACCESS pending a privileged backend.
- Outbound email credentials belong in Secret Manager, not in database rows or the frontend.
- Provisioning and publishing the SQL service have not happened from this PR.

## Scope of first migration
1. Identity: AppUser, Company, Department, CompanyMember, CompanyRole, MemberRole and StaffApplication.
2. Customers, opportunities, insurer catalog, policies and documents.
3. Commissions, service cases, activity logs.
4. Namecheap mailboxes and conversation indexes later, after the provider is contracted.

Existing Firestore data stays intact during the transition. It is not automatically migrated by these files.
