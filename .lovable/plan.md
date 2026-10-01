# Team feedback: 5 generator changes

## 1. Nordic Klarna entries (merchant + partner)
Add three entries directly after the existing Klarna methods, in both languages:
- Klarna - Pay Later - NO, FI, DK, SE
- Klarna - Pay Now - NO, FI, DK, SE
- Klarna - Pay in 3/4 - NO, FI, DK, SE

They work like every other method: select, set a rate, and the euro formatting applies.

## 2. "Gemaakt door" on the merchant cover page
- Add a new field, "Gemaakt door" (English: "Prepared by"), directly under "Voorstel voor".
- The field is saved with the proposal and stays hidden on the cover when left empty.
- The "Contract periode" sentence is out of scope (you said to ignore it).

## 3. "Vergelijk Refund rate" (merchant)
- Add a separate switch, independent of the main "Vergelijking", that is off by default.
- When it is on, page two shows a second Refund line or column with the old and the new refund rate. Both rates can be edited and are saved.
- It appears in the PDF only when switched on.

## 4. POS discount of 0 or empty (merchant + partner)
- If "Korting POS hardware" is 0 or empty, the POS table shows one price column only, with the default prices.
- With a discount above 0, the table keeps showing both the default and the discounted price.

## 5. POS-only offer (merchant + partner)
- Add an "ECOM prijzen" switch that is on by default.
- Switching it off removes all ECOM pricing pages and tables from the preview and PDF, so the offer shows POS pricing only. Page numbers and the table of contents adjust.
- The setting is saved per proposal. Existing proposals keep ECOM switched on.

## Technical details
- All changes live in src/generator/proposal-generator.html. No database changes.
- New state: S.fields.gemaaktDoor, S.cmpRefund plus old-refund value, S.showEcom (default true). Older payloads without these keys fall back to the defaults.
- The Klarna rows go in baseRows(lang) next to the existing Klarna entries.
- Point 4 means a conditional column count in the merchant and partner POS renderers.
- Point 5 adds a guard in the page builder that skips the ECOM pricing pages.
- After building, test in the preview (NL and EN, merchant and partner, PDF export), then publish once you confirm.
