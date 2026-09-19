# Secure team access and public publishing

## Goal
Publish the app at a normal web address while keeping the proposal generator and team overview private. Each colleague signs in with their own email address and password; they do not need a Lovable account.

Prospects will continue opening their unique proposal links without creating an account.

## Access model

```text
Public website address
├── Sign-in page                         public
├── Proposal generator                  signed-in team only
├── Sent-proposals overview             signed-in team only
└── /sign/<secret-link>                 public prospect access
```

- Use individual email/password accounts rather than a shared password.
- Do not add profile records, display names, roles, or preferences.
- Do not offer public registration. Colleague accounts are added deliberately through the app's backend user management.
- Include sign out, forgotten-password email, and a secure password-reset page.
- Enable leaked-password checks and require a user's current password for signed-in password changes.

## What will be built

### 1. Sign-in and recovery
- Add a clean branded sign-in page with email, password, validation, loading, and generic error states.
- Add “Forgot password” and the required reset-password screen.
- Keep the signed-in state current and provide a visible sign-out action.
- Return users to the page they originally requested after successful sign-in.

### 2. Protect the complete internal app
- Place both the generator and `/voorstellen` behind the managed signed-in route guard.
- Remove the generator HTML from the directly accessible public-file location.
- Load the generator only after the signed-in user has been verified, so knowing its former file URL cannot bypass login.
- Keep prospect signing pages outside the team gate.

### 3. Secure proposal operations
- Require a valid signed-in team session when creating or updating a proposal or viewing the internal overview.
- Associate newly shared proposals with the signed-in colleague's account, without creating a profile table.
- Preserve token-based public read/sign access for prospects, using the existing high-entropy secret links.
- Ensure internal proposal actions pass the signed-in session from the generator to the protected server endpoint.

### 4. Account setup and publishing
- Enable email/password authentication with email confirmation.
- Disable public self-registration in the interface; colleagues are added intentionally by the owner.
- Verify signed-out users cannot access the generator, overview, underlying HTML, or protected write endpoints.
- Verify a prospect can still open, complete, and sign a valid secret proposal link without logging in.
- Run desktop and narrow-screen checks, then publish with public URL visibility. The URL is public, but internal content remains authentication-protected.

### 5. Continuity and ownership safeguards
- Keep the GitHub repository private where possible. A public repository reveals the app's source code and browser-visible configuration, but not passwords, private server secrets, or database records.
- Treat source-code privacy as separate from app security: authorization will be enforced at the protected pages, server endpoints, and database rules, so inspecting the code cannot grant access.
- Document the browser-visible configuration versus server-only secrets and confirm no sensitive value is committed to GitHub.
- Export Cloud data periodically from Cloud → Advanced settings → Export data, especially before changing or cancelling a subscription.
- Keep the code portable through GitHub so the app can be moved to another host later. A move would require a replacement backend/auth service or migrating the existing service configuration and data; GitHub sync alone does not copy hosted users, sessions, database records, storage, or secrets.
- Do not disconnect Lovable Cloud as a subscription workaround: disconnecting is irreversible and permanently deletes Cloud data, storage, and functions.

## Security boundaries
- Passwords are handled by Lovable Cloud authentication and are never stored in application code.
- Route protection is paired with server-side authorization; hiding screens alone is not treated as security.
- Sign-out clears protected cached data before returning to sign-in.
- Public prospect endpoints remain limited to possession of an unguessable proposal token and validated payloads.
- Browser-visible publishable keys may appear in a public repository by design; database access remains limited by authentication and row-level access rules. Private administrative keys stay outside GitHub.

## Subscription considerations
- Downgrading or cancelling does not transfer authentication to GitHub and does not make private data public.
- The project and ownership remain, but features unavailable on the resulting plan may stop working and publishing new changes may be restricted.
- Official documentation does not guarantee indefinite Cloud authentication/database operation after every future plan change. Before changing the subscription, export the data and verify the current plan's Cloud and publishing allowances.

## Technical notes
- Use the existing Lovable Cloud authentication integration and bearer-token middleware.
- Add an owner identifier to proposals with authenticated access rules and explicit grants.
- Keep the prospect read/sign handlers public while splitting or guarding creator-only operations.
- Add unique metadata for each new page and preserve the existing proposal-generator functionality unchanged.

## Not included
- Public signup
- Google sign-in
- User profiles or avatars
- Roles or administrator permissions
- Changes to the generator's proposal features or PDF output
