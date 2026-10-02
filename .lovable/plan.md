# Team defaults: names, default rates, "Nieuw voorstel"

## 1. Full name pop-up and "Gemaakt door"
- On the next sign-in, any colleague without a saved full name gets a short pop-up: "Wat is je volledige naam?" It can't be skipped, and it is asked only once.
- The name is saved on their account and fills in "Gemaakt door" automatically on every new merchant and partner proposal. They can still change it per proposal.
- Existing saved proposals keep what they have.
- Colleagues can change their name later on the account or Team page. The owner sees the names in the Team overview.

## 2. Default rates for every new proposal
- You upload your default rates file (Excel, CSV or PDF are all fine). I read it and set those rates as the starting values for every new merchant and partner proposal, ECOM and POS, in NL and EN.
- The linked card rates (Visa, Mastercard, Maestro, Cartes Bancaires, POS cards), euro formatting and IC++ keep working as they do now.
- The rates are the same for the whole team. If they change later, send the new file and I'll update them.
- Saved proposals keep their own rates.

## 3. "Nieuw voorstel" button
- A third option in the actions menu, next to Dupliceer and Reset invoer: "Nieuw voorstel".
- It opens a fresh proposal with the default rates and your name in "Gemaakt door". You pick merchant or partner, and the language stays as it is.
- The proposal you were working on is untouched. If it has unsaved changes, you are asked to save first.

## Needed from you
- The default rates file (upload it in the chat once this plan is approved).

## Technical details
- Migration: add a `full_name text` column to `team_members`, plus a server function `setMyFullName` (requireSupabaseAuth, updates only the caller's row). `getMyAccess` returns `full_name`. The authenticated layout shows a blocking dialog when it is empty.
- The generator iframe receives the name with a new postMessage (`__mspProfile`). `defaultState()` uses it for `fields.auteur`.
- Default rates are hard-coded in `baseRows(lang)` / `posDefaults(lang)` / fee defaults in proposal-generator.html. No database table is needed.
- New `#newBtn` in `#moreMenu`: checks for unsaved changes, then sets `S=defaultState(docType, lang)` with a new id and calls renderAll().
- Test in the preview, then publish once you confirm.
