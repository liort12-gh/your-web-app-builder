# Phase 2 — Prospect signing, Salesforce sync and account signup redirect

Status: draft for Compliance review. Nothing is built until this plan is approved.

## Overview

```text
Rep finishes proposal
   │
   ▼
Step A  Mandatory revenue calculation (AOV, tx/month per method)
   │
   ▼
Step B  "Verstuur naar prospect": name + email
   │     ├─ Salesforce: find Opportunity by email → stage "Proposal Sent", Amount = calculated value
   │     └─ Prospect receives private link by email
   ▼
Step C  Prospect opens link → enters 6-digit code sent to same email
   │
   ▼
Step D  Prospect reads, fills company details, signs
   │     ├─ Proposal locked, signed PDF stored
   │     ├─ Salesforce: stage "Closed Won / Signed"
   │     └─ Rep notified by email
   ▼
Step E  New tab opens MultiSafepay account signup page
```

## 1. Signing flow (built in, email-code protected)

- Send button in the generator opens a dialog: prospect name, email, optional message, language (follows proposal NL/EN).
- The revenue calculator must be completed first; the send button stays disabled until it is.
- Prospect receives an email with a unique, unguessable link (no account needed).
- Opening the link requires a 6-digit code emailed to that same address:
  - Code valid 10 minutes, single use, max 5 attempts, then 15-minute lockout.
  - Only a hashed version of the code is stored.
- Link rules: expires after 30 days (configurable), can be revoked by the rep, becomes read-only after signing, cannot be edited once sent (edits create a new version and invalidate the old link).
- Signing: prospect fills company/contact fields, draws or types signature, ticks "I have read and agree" plus link to MultiSafepay terms.
- Audit trail per proposal: sent (by whom, to whom), each code request, each successful/failed verification, each view, signature — all with timestamp, IP address and browser info. Shown to the rep and appended as a final page to the signed PDF.
- Signed PDF stored privately; copy emailed to prospect and rep.
- Rep sees status in "Mijn voorstellen": Concept, Verstuurd, Bekeken, Ondertekend, Verlopen, Ingetrokken.
- Legal standing: simple electronic signature (eIDAS SES) with email verification. DocuSign remains a later option if Compliance requires an advanced signature.

## 2. Salesforce connection

- One MultiSafepay Salesforce connection, used only by the server; no Salesforce credentials in the browser.
- On send: look up an open Opportunity whose Contact (via Contact Role) has the prospect's email.
  - One match: update Stage to the "Proposal Sent" stage and Amount to the calculated value; store extra fields (monthly revenue, annual volume) if the fields exist.
  - No match or several matches: the rep picks the Opportunity from a short list, or sends without Salesforce sync (logged).
- On signature: Stage to "Closed Won / Signed", attach the signed PDF and audit trail to the Opportunity.
- Every Salesforce update is logged; failures are shown to the rep and retried, and never block the prospect.
- Amount definition to confirm: annual revenue (monthly × 12) is the proposed default.

## 3. Account signup redirect

- After a successful signature, the prospect sees a confirmation page and a new tab opens to the MultiSafepay signup page (merchant and partner URL may differ). A visible button is also shown in case the browser blocks the new tab.
- No proposal data is passed in the URL unless Compliance approves a specific tracking parameter.

## Compliance and privacy points for review

- Personal data processed: prospect name, email, company details, signature image, IP address, browser info.
- Storage: MultiSafepay's backend in the EU; signature data and PDFs only accessible to the owning rep and the server.
- Retention: proposed 7 years for signed proposals (fiscal), 12 months for unsigned/expired ones, then deleted. To confirm.
- Emails sent from a MultiSafepay-owned sender domain (e.g. voorstellen@…); required before building.
- Salesforce receives only: stage, amount, revenue figures, signed PDF, audit summary.
- Legally binding pages remain in Dutch (existing rule).
- Prospect privacy notice linked on the signing page.

## Open items / prerequisites

1. Compliance approval of this plan (signature level, retention, data sent to Salesforce).
2. Sender email domain set up (currently not configured — blocks step 1).
3. Salesforce: connection by a Salesforce admin, exact stage names, Amount definition, custom field names.
4. Signup URLs for merchant and partner.

## Rollout order

1. Sender domain + signing flow with code gate, audit trail, signed PDF.
2. Mandatory revenue step + signup redirect.
3. Salesforce sync (stage + amount + PDF attach).
Each stage tested in preview and published separately.

## Technical details

- New tables: `proposal_shares` (token hash, recipient, expiry, revoked, status), `proposal_otp` (code hash, attempts, expiry), `proposal_events` (audit log), `salesforce_sync_log`; RLS scoped to owner; prospect access only via server routes under `/api/public/` validating token + verified-session cookie.
- Reuse parked `.phase2/` code as a base; `share_token` default replaced by server-generated random tokens stored hashed.
- Emails via Lovable transactional email on the verified sender domain.
- Salesforce via the Salesforce connector gateway from server functions (SOQL lookup on OpportunityContactRole, PATCH Opportunity, ContentVersion upload for the PDF).
- Revenue calculator values saved in the proposal payload and sent with the share request.
