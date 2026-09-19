# Phase 1 — Private team proposal application

## Goal
Publish the existing proposal generator at a normal public web address while keeping the application itself private. Only approved team members can sign in and use it. Each member sees and manages only their own proposals.

Phase 1 contains no prospect features at all.

## Access model

```text
Public web address
├── Sign in                      public page
├── Request access               public page
├── Reset password               public page
├── Proposal generator           approved team member only
├── My proposals                 approved team member only
└── Team management              application owner only
```

Account states:
- Application owner (exactly one at a time, transferable)
- Approved team member
- Pending access request
- Deactivated member

## Confirmed decisions
- Individual email and password accounts; no shared password.
- No open self-registration. Anyone may request access; access begins only after the owner explicitly approves.
- Each member sees only their own proposals. No cross-member viewing, editing, or deleting.
- The owner gets team-management powers, not extra visibility into other members' proposals.
- Ownership is stored as the signed-in user's stable identifier, never an email address in code.

## What will be built

### 1. Sign-in and password handling
- Sign-in page with email and password, validation, loading state, and deliberately generic error messages.
- Forgot-password request and a dedicated secure reset-password page.
- Visible sign-out that also clears locally cached protected data.
- Email confirmation for new accounts, leaked-password checking, and current-password confirmation when a signed-in member changes their password.
- After signing in, the member returns to the page they originally requested.

### 2. Request access and approval
- Public "Request access" page collecting an email address and an optional short note, with a clear "awaiting approval" confirmation.
- Requests never grant access by themselves.
- Owner-only team management screen listing pending requests and current members, with approve, reject, deactivate, and reactivate actions.
- Approved people receive their sign-in ability; rejected and deactivated people are blocked from the internal application immediately.

### 3. Ownership and transfer
- The first owner is recorded once during setup from the actual signed-in identifier, not written into the code.
- The owner can transfer ownership to another approved member through a deliberate action with a confirmation step.
- Transfer requires no code change and no database change.
- Exactly one owner exists at any time; the previous owner remains a normal approved member.

### 4. Proposal ownership and protection
- Every proposal is linked to the creating member's stable identifier.
- Reading, creating, updating, and deleting a proposal is authorized on the server and limited to its creator.
- Changing an identifier in a request cannot reveal or alter someone else's proposal.
- The existing proposal record keeps its conventional structure so the data stays portable.

### 5. Protect the whole internal application
- The generator, the proposals overview, and every protected data operation require an approved, active session.
- The generator file is no longer reachable as a plain public file; it loads only after the session is verified.
- Pending and deactivated accounts are refused even when signed in.
- Route protection is paired with independent server-side checks, so hiding screens is never the security mechanism.

### 6. Proposals overview becomes real
- `/voorstellen` is rebuilt to list the signed-in member's own stored proposals instead of device-local records.
- Shows title, type, and last-updated moment, with open and delete actions where already supported.
- No share links, statuses, or prospect information appear anywhere.

### 7. Preserve the generator
- Keep all existing proposal fields, calculations, pricing tables, POS handling, comparison column, layout, and PDF output unchanged.
- The only generator adjustments are the ones required for signing in, saving under the member's account, and navigation.
- Prospect-sharing controls are hidden from the Phase 1 interface rather than rewritten.

### 8. Verification before publishing
Signed-out visitors: cannot open the generator, cannot open the overview, cannot reach the generator file directly, and cannot read, create, change, or delete proposal data through direct requests.

Approved members: can sign in, create, view, edit, and delete their own proposals, generate PDFs, and sign out.

Pending and deactivated accounts: are refused access.

Cross-account check: a member cannot reach another member's proposal by altering an identifier.

Owner: can approve, reject, deactivate, reactivate, and transfer ownership without any code change.

### 9. Publishing
- Publish at a public web address with the application protected by sign-in and server-side authorization.
- Keep the code repository private where practical.
- Keep private server credentials out of the repository and out of browser-visible code.

## Portability notes
- Application identity is always the stable user identifier, so authentication could later move to another standards-based provider without touching proposal logic.
- Authentication, proposal data, server operations, and the interface stay separated, with identity read through one small shared layer.
- The data model stays conventional PostgreSQL so proposals can be exported or migrated later.
- Optimized for a simple, quick POC while avoiding unnecessary lock-in.

## Technical notes
- Move internal pages under the authenticated route group and gate the underlying generator document behind an authenticated server route.
- Add an owner identifier plus creation and update timestamps to the proposal record, with access rules restricted to the creator and explicit database grants.
- Add membership records covering state (pending, approved, rejected, deactivated) and a single owner marker, plus server operations for approval, rejection, deactivation, and ownership transfer, each authorized against the current owner.
- Replace the current unauthenticated proposal endpoints used by the internal app with authenticated server operations; leave prospect-era code inactive and unexposed.
- Enable email sign-in, disable self-service signup, enable leaked-password protection, and require the current password for signed-in password changes.
- Give every new page its own title and description, and replace the placeholder site metadata.

## Explicitly not in Phase 1
- Prospect sharing, share buttons, and share workflows
- Public proposal links, tokens, and `/sign/<link>` pages
- Prospect accounts, prospect signing, and prospect notifications
- Public proposal endpoints
- Proposal expiration, revocation, prospect status, and audit history
- Roles beyond owner and approved member
- Redesign of the generator or its PDF output
