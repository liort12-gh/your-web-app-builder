import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { deleteMyProposal, listMyProposals } from "@/lib/proposals.functions";

export const Route = createFileRoute("/_authenticated/voorstellen")({
  head: () => ({
    meta: [
      { title: "Mijn voorstellen — overzicht" },
      {
        name: "description",
        content: "Overzicht van de voorstellen die u zelf heeft opgeslagen, met laatste wijziging.",
      },
      { property: "og:title", content: "Mijn voorstellen" },
      { property: "og:description", content: "Bekijk en beheer uw opgeslagen voorstellen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OverviewPage,
});

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OverviewPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listMyProposals);
  const remove = useServerFn(deleteMyProposal);

  const { data, isLoading } = useQuery({
    queryKey: ["my-proposals"],
    queryFn: () => list({ data: undefined }),
  });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-proposals"] }),
  });

  return (
    <main className="mx-auto w-full max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mijn voorstellen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alleen u ziet deze voorstellen. Open er een in de generator om verder te werken.
          </p>
        </div>
        <Link
          to="/generator"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Naar de generator
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}

        {!isLoading && (data ?? []).length === 0 && (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Nog geen voorstellen opgeslagen. Maak er een in de generator en kies “Opslaan”.
          </div>
        )}

        {(data ?? []).map((row) => (
          <article
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-card-foreground">{row.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.docType === "partner" ? "Partner" : "Merchant"} · bijgewerkt{" "}
                {formatDate(row.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/generator"
                search={{ open: row.id }}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Openen
              </Link>
              <button
                onClick={() => {
                  if (window.confirm(`"${row.name}" verwijderen?`)) deletion.mutate(row.id);
                }}
                disabled={deletion.isPending}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-accent disabled:opacity-60"
              >
                Verwijderen
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
