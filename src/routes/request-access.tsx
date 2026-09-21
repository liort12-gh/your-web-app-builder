import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/request-access")({
  head: () => ({
    meta: [
      { title: "Toegang aanvragen — MSP Voorstellen" },
      {
        name: "description",
        content:
          "Vraag toegang aan tot de interne voorstellenomgeving. Een aanvraag wordt pas actief na goedkeuring.",
      },
      { property: "og:title", content: "Toegang aanvragen" },
      {
        property: "og:description",
        content: "Aanvragen worden handmatig goedgekeurd door de beheerder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestAccessPage,
});

function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (signUpError) {
      setError("Aanvraag kon niet worden verstuurd. Probeer het later opnieuw.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight text-card-foreground">Toegang aanvragen</h1>

        {done ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Uw aanvraag staat klaar. Bevestig eerst uw e-mailadres via de e-mail die u ontvangt.
              Daarna moet de beheerder uw toegang nog goedkeuren — u kunt de omgeving pas gebruiken
              zodra dat is gebeurd.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Naar inloggen
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Kies uw e-mailadres en wachtwoord. Toegang wordt pas actief na goedkeuring door de
              beheerder.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-foreground">
                  Zakelijk e-mailadres
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                  Gewenst wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="password-confirm" className="block text-xs font-semibold text-foreground">
                  Wachtwoord bevestigen
                </label>
                <input
                  id="password-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Versturen…" : "Aanvraag versturen"}
              </button>
            </form>
            <p className="mt-5 text-sm text-muted-foreground">
              Al toegang?{" "}
              <Link to="/auth" className="text-primary underline-offset-2 hover:underline">
                Inloggen
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
