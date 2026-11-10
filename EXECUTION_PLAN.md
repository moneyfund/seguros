# ACOS Enterprise · Execution baseline

Status: production-oriented development, not a sale/demo promise. No private customer information is authorized until security tests pass.

## Goal
Build one reusable brokerage ERP/CRM that can run as a responsive web app and PWA, independent from the final brand domain and corporate email provider.

## System of record and cloud ownership
- Firebase project: seguros-d1a86; temporary Firestore workflow for invitations and existing pilot only.
- Future authoritative data: Firebase SQL Connect over Google Cloud SQL PostgreSQL. Schema source: dataconnect/schema/schema.gql.
- Identity: Firebase Authentication, verified identities. Email is contact information, not a stable primary key; UID is.
- Documents: Firebase Storage (file contents) + SQL ManagedDocument (relationships, uploader, actor, version and storage path).
- React frontend: Vercel; no local server or employee-side database installation.
- Namecheap: eventual IMAP/SMTP mailboxes; no SMTP secrets in frontend.
- Company domain, UI brand and mail domain are configurable per brokerage, not embedded in database relations.

## Current shipping blocks
1. Provision SQL Connect/Cloud SQL in the desired region; confirm billing and the database name/instance before migration. Not performed by GitHub edits.
2. Run schema migrations with explicit review and generate the type-safe JS SDK.
3. Replace existing Firestore read/write adapters with SQL Connect on the business modules, one bounded workstream at a time.
4. Make role and view authorization enforceable by SQL Connect connector checks and document access policy, not menu-only.
5. Implement a privileged approval backend: verify invitation, verify uploaded identity, upsert member, grant roles, assign unique code, record audit and schedule notification in one controlled process.
6. Validate Firebase Storage rules, Firebase Auth policies, account revocation and document retention; never request real IDs before they pass.
7. Run flow tests on web and mobile for different roles. Test clients in a separate environment from company data.
8. Deploy only a tested release to a single canonical Vercel project.

## Currently implemented on this branch
- Corporate onboarding no longer waits for a purchased email domain.
- Direction can authorize an email before the collaborator submits an identity request.
- Self-service requires a verified Firebase account and existing invitation.
- Photos and identity document rules restrict access to applicant/owner.
- Staff approvers assign department, employee code, operational roles and specific panels; role/view permissions intersect for existing Firestore data.
- Employee panel access updates on membership changes.
- Full SQL relational schema and read-only self-owned SQL Connect operations are versioned and ready for cloud validation.
- The isolated Firestore pilot is preserved, not treated as the SQL data store.

## Access design
Direction: company members, invitations, approval, full operational reports.
Sales: own leads, assigned clients, policies, own files.
Operations: policy intake, issued policies, documents, renewals.
Customer Service: cases, authorized customer context, service documents.
Finance: premiums, commissions, settlement data.
Supervision: team performance and delegated records.
Customer: own policies, own requests and shared documents.

No role gets cross-company access by virtue of matching email suffix or choosing a UI view.

## Acceptance milestones
- Invite / accept: uninvited verified users cannot submit a file or grant themselves roles.
- Approve: only direction can approve and every new member has a unique code and explicit allowedSections.
- Revoke: active sessions lose access after deactivation, even when they leave the tab open.
- Customer journey: record customer -> assign lead -> quote -> policy -> commission -> document -> renewal.
- Audit: all writes record immutable authenticated actor metadata.
- Storage: uploads are attributable and accessible only to intended roles.
- CRM mail: account sync is backend only; credentials remain in Secret Manager; outbound actions audited.
- Security: negative test suite for cross-tenant/cross-role access.

## Release and Vercel hygiene
Two Vercel projects are currently linked to moneyfund/seguros: seguros and seguros-mknk.
Use seguros-mknk as the reference project after verifying its deployed environment variables. An additional Vercel project and a preview per branch create duplicate deployment links. Don't delete or disconnect the duplicate without explicit approval; first verify the canonical project and make a rollback plan.

This branch supersedes exploratory staff and pilot branches but leaves them intact for history. Do not merge into main before code, database, and rule validation.

## Cost and brand constraints
No domain or Namecheap mailbox is required to build schema, roles, invitations and interfaces.
Provisioning a paid Cloud SQL resource is a separate billed infrastructure action.
No production credentials or real personal identification data are checked into GitHub.
