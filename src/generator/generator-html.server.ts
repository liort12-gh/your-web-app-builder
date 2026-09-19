// Server-only: the generator document is never served as a public file.
import html from "./proposal-generator.html?raw";

export function getGeneratorDocument(): string {
  // Relative URLs must resolve against the site root when the document is
  // rendered from an inline (srcdoc) frame. Prospect sharing is Phase 2, so the
  // share control stays hidden in this phase.
  const injected = `<base href="/">\n<style>#shareBtn{display:none !important}</style>`;
  return html.replace(/<head>/i, `<head>\n${injected}`);
}
