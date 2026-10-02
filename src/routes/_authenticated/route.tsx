import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

import { getMyAccess, setMyFullName } from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const fetchAccess = useServerFn(getMyAccess);
  const { data, isLoading } = useQuery({
    queryKey: ["access"],
    queryFn: () => fetchAccess({ data: undefined }),
  });

  if (isLoading) {
    return <Shell>{<p className="text-sm text-muted-foreground">Toegang controleren…</p>}</Shell>;
  }

  if (!data || data.status !== "approved") {
    return (
      <Shell>
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-base font-semibold text-card-foreground">
            {data?.status === "pending"
              ? "Uw aanvraag wacht op goedkeuring"
              : "Geen toegang tot deze omgeving"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data?.status === "pending"
              ? "Zodra de beheerder uw aanvraag goedkeurt, kunt u voorstellen maken en beheren."
              : "Neem contact op met de beheerder als u toegang nodig heeft."}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell isOwner={data.isOwner} email={data.email}>
      {!data.fullName ? <NameDialog /> : <Outlet />}
    </Shell>
  );
}

function Shell({
  children,
  isOwner,
  email,
}: {
  children: React.ReactNode;
  isOwner?: boolean;
  email?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link to="/generator" className="text-foreground hover:text-primary">
            Generator
          </Link>
          <Link to="/voorstellen" className="text-foreground hover:text-primary">
            Mijn voorstellen
          </Link>
          {isOwner && (
            <Link to="/team" className="text-foreground hover:text-primary">
              Team
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {email && <span className="text-xs text-muted-foreground">{email}</span>}
          <button
            onClick={signOut}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            Uitloggen
          </button>
        </div>
      </header>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}

function NameDialog() {
  const save = useServerFn(setMyFullName);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setErr("Vul je volledige naam in");
    setBusy(true);
    setErr("");
    try {
      await save({ data: { fullName: name.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["access"] });
    } catch {
      setErr("Opslaan mislukt, probeer opnieuw");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="text-base font-semibold text-card-foreground">Wat is je volledige naam?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Je naam komt standaard bij "Gemaakt door" in nieuwe voorstellen.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Voornaam Achternaam"
          maxLength={100}
          className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
      </form>
    </div>
  );
}
