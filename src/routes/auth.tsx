import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Inloggen — MSP Voorstellen" },
      {
        name: "description",
        content: "Meld u aan met uw e-mailadres en wachtwoord om voorstellen te maken en te beheren.",
      },
      { property: "og:title", content: "Inloggen — MSP Voorstellen" },
      { property: "og:description", content: "Interne omgeving voor het maken van voorstellen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError("Inloggen mislukt. Controleer uw e-mailadres en wachtwoord.");
      return;
    }
    navigate({ to: "/generator", replace: true });
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setNotice("Als dit e-mailadres bekend is, ontvangt u een e-mail om uw wachtwoord opnieuw in te stellen.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight text-card-foreground">
          {mode === "signin" ? "Inloggen" : "Wachtwoord vergeten"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Interne omgeving voor voorstellen."
            : "Vul uw e-mailadres in, dan sturen we een herstellink."}
        </p>

        <form onSubmit={mode === "signin" ? signIn : sendReset} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground">
              E-mailadres
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

          {mode === "signin" && (
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Bezig…" : mode === "signin" ? "Inloggen" : "Herstellink sturen"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "forgot" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="text-primary underline-offset-2 hover:underline"
          >
            {mode === "signin" ? "Wachtwoord vergeten?" : "Terug naar inloggen"}
          </button>
          <p className="text-muted-foreground">
            Nog geen toegang?{" "}
            <Link to="/request-access" className="text-primary underline-offset-2 hover:underline">
              Toegang aanvragen
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
