# Aurevia Estates: application runbook

Publish property listings and advisor profiles, manage viewing requests, receive enquiries and subscription requests, and save homes within an account. Public listing, booking, contact, map and advisor interfaces use published inventory. Viewing dates/times are UTC and duplicate active slots are rejected in the same transaction that reserves them.

Properties and advisors support drafts, image URLs, before/after review, selected publication and unpublishing. Forms provide named reference choices rather than requiring record identifiers.

## Run locally

Open this application's folder in a terminal. Install dependencies, then run:

```text
npm install
npm run admin:bootstrap
npm run build
npm run start -- --hostname 127.0.0.1 --port 5322
```

Bootstrap only once. Existing owners are protected from replacement. Generated local login details are in the ignored file .app-data/local-owner.json; do not commit it. The application is currently served at http://127.0.0.1:5322/, with the private workspace at /workspace. For a section link use /workspace?collection=<collection-key>.

CMS workflow: open a collection, edit a record and save a draft. Open **Review & publish**, compare published and saved values, select records and publish. Published snapshots alone reach the public site. Editors cannot publish; the owner grants roles under **Access management**. Registering creates a member account, never a privileged account.

## Storage and deployment

Local state uses .app-data/state.json. Writes use an exclusive cross-process lock, fsync and atomic replacement. Keep this directory on a persistent backed-up volume for a Node host. Content backups and CSV exports exclude credentials and sessions. Backups are exports; automatic restoration is not implemented. Secure full-volume backups remain the host operator's responsibility.

An optional Neon adapter is included, but no real Neon connection has been configured or verified. Each project has its own application key and should use its own database configuration, separate from the portfolio. For Vercel, set a private DATABASE_URL, explicitly run npm run db:provision against the intended database, then bootstrap the owner there. No production migrations have been run. Vercel without durable database configuration rejects data operations; do not rely on its filesystem for writes.

Use HTTPS. Session cookies are HTTP-only and SameSite=Lax, with Secure on HTTPS. Mutations require same-origin JSON. Role changes revoke existing sessions. Login and public submissions have process-local rate limits; multi-instance deployment needs shared edge/application rate limiting.

## Verified and pending

- PASS: production build; 17 backend cases, including an independent-process concurrency test. Run npm run test:server.
- PASS: workspace form, array-editor, comparison and menu DOM simulation. This is not a real browser/device review.
- HTTP route/authentication checks are recorded in the portfolio's SIX-PROJECT-UPGRADE.md and workspace test reports.
- BLOCKED: the browser automation runtime cannot write its kernel assets. Fresh screenshots, actual rendered appearance and mobile/tablet interaction review remain pending.
- NOT RUN: Neon integration, public deployment, external payment/email/AI services.

## Implemented boundaries

Demonstration inventory and agency contacts are sample data. A viewing request does not purchase a property. The map is a styled location preview, not an external mapping service. Mortgage values are estimates; automatic emails and payment processing are not configured. CMS photos must use local public paths or a host allowed by next.config.ts.
