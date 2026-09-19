import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MSP Voorstellen — interne omgeving" },
      {
        name: "description",
        content:
          "Besloten omgeving voor het maken en beheren van merchant- en partnervoorstellen. Alleen voor goedgekeurde teamleden.",
      },
      { property: "og:title", content: "MSP Voorstellen" },
      {
        property: "og:description",
        content: "Besloten omgeving voor merchant- en partnervoorstellen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof document === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/generator" });
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">MSP Voorstellen</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Deze omgeving is besloten. Meld u aan om voorstellen te maken en te beheren.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Inloggen
          </Link>
          <Link
            to="/request-access"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Toegang aanvragen
          </Link>
        </div>
      </div>
    </main>
  );
}
