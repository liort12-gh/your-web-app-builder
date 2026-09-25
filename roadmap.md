# Roadmap

- [x] Show how each proposed top-bar option reorganizes existing controls and interactions.
- [x] Implement the approved top-bar direction without changing functionality.
- [ ] Refine the sidebar using the chosen structured direction, preserving every feature and keeping the long payment-method list neat.
- [x] Phase 1 build: sign in, forgot/reset password, sign out, request access, owner approval/rejection/deactivation, ownership transfer by user ID, proposal ownership per user, server-side authorization, protected generator and overview.
- [x] Phase 1 verification: owner bootstrap, save/open/delete round-trip, PDF download, pending block (UI + no data leak), signed-out redirects, unauthenticated server calls rejected (401).
- [ ] Publish Phase 1 to the public URL (app stays login-protected).
- [ ] Phase 2 (ON HOLD pending Compliance approval — plan saved in .lovable/plan.md): prospect signing flow with 6-digit email code gate + audit trail + signed PDF; mandatory revenue calculator before sending; Salesforce sync (stage "Proposal Sent"→"Closed Won/Signed" + Opportunity Amount); post-signing redirect to MSP account signup. Blocked on: Compliance approval, sender email domain, Salesforce connector, signup URLs.
