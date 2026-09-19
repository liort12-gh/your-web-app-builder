import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nieuw wachtwoord instellen — MSP Voorstellen" },
      {
        name: "description",
        content: "Stel een nieuw wachtwoord in voor uw account in de interne voorstellenomgeving.",
      },
      { property: "og:title", content: "Nieuw wachtwoord instellen" },
      { property: "og:description", content: "Kies een nieuw wachtwoord voor uw account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      setReady(isRecovery || Boolean(data.session));
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError("Wachtwoord bijwerken mislukt. Vraag een nieuwe herstellink aan.");
      return;
    }
    navigate({ to: "/generator", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight text-card-foreground">
          Nieuw wachtwoord instellen
        </h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Open deze pagina via de herstellink in uw e-mail.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                Nieuw wachtwoord
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "Opslaan…" : "Wachtwoord opslaan"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
