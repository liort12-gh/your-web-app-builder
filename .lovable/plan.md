# Optional old-vs-new merchant pricing

## What will change
- Add a merchant-only option to compare current and proposed rates.
- When enabled, merchant pricing tables gain a second rate column for the old rate.
- Keep the existing rate as the new/proposed rate and preserve all current calculations and PDF behavior.
- Keep partner proposals unchanged.

## Behavior
- The comparison is off by default.
- Old-rate cells are editable and saved with the proposal.
- The extra column appears in the generated proposal and PDF only when enabled.
- The revenue calculator continues to use the new/proposed rate.

## Technical details
- Extend the proposal state with a merchant comparison toggle.
- Add the toggle to the merchant editing controls.
- Render conditional old/new pricing headers and editable old-rate cells across merchant pricing tables.
- Reuse the existing euro/percentage formatting rule for both rate columns.
- Verify merchant comparison on/off, partner isolation, saving/restoring, and PDF-safe layout.
