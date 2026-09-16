import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/voorstellen")({
  head: () => ({
    meta: [
      { title: "Verstuurde voorstellen — overzicht" },
      {
        name: "description",
        content:
          "Overzicht van de voorstellen die u met een deellink heeft verstuurd, met status en ondertekening.",
      },
      { property: "og:title", content: "Verstuurde voorstellen" },
      {
        property: "og:description",
        content: "Bekijk welke voorstellen zijn verstuurd en welke al zijn ondertekend.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OverviewPage,
});

type ShareRecord = {
  title?: string;
  docType?: string;
  createdAt?: string;
};

type Row = {
  token: string;
  title: string;
  docType: string;
  createdAt?: string | undefined;
  status: "sent" | "signed" | "missing" | "loading";
  signerName?: string | undefined;
  signedAt?: string | undefined;
};

const SHARES_KEY = "msp_shares_v1";

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
  const [rows, setRows] = useState<Row[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let stored: Record<string, ShareRecord> = {};
    try {
      stored = JSON.parse(localStorage.getItem(SHARES_KEY) || "{}");
    } catch {
      stored = {};
    }

    const base: Row[] = Object.entries(stored)
      .map(([token, rec]) => ({
        token,
        title: rec.title || "Voorstel",
        docType: rec.docType === "partner" ? "Partner" : "Merchant",
        createdAt: rec.createdAt,
        status: "loading" as const,
      }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    setRows(base);

    void Promise.all(
      base.map(async (row) => {
        try {
          const res = await fetch(`/api/public/proposals?token=${encodeURIComponent(row.token)}`);
          if (!res.ok) return { ...row, status: "missing" as const };
          const data = await res.json();
          return {
            ...row,
            title: data.title || row.title,
            status: data.status === "signed" ? ("signed" as const) : ("sent" as const),
            signerName: data.signature?.signerName,
            signedAt: data.signedAt,
          };
        } catch {
          return { ...row, status: "missing" as const };
        }
      }),
    ).then(setRows);
  }, []);

  async function copyLink(token: string) {
    const url = `${window.location.origin}/sign/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied((current) => (current === token ? null : current)), 2200);
    } catch {
      window.prompt("Kopieer deze link:", url);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verstuurde voorstellen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alleen zichtbaar op dit apparaat. Deel de link met uw prospect om te laten ondertekenen.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Naar de generator
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {rows === null && <p className="text-sm text-muted-foreground">Laden…</p>}

        {rows !== null && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Nog geen voorstellen verstuurd. Maak er een in de generator en kies “Deel met prospect”.
          </div>
        )}

        {rows?.map((row) => (
          <article
            key={row.token}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-card-foreground">{row.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.docType} · gedeeld {formatDate(row.createdAt)}
                {row.status === "signed" && (
                  <>
                    {" "}
                    · ondertekend door {row.signerName || "prospect"} op {formatDate(row.signedAt)}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={row.status} />
              <button
                onClick={() => copyLink(row.token)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                {copied === row.token ? "Gekopieerd ✓" : "Kopieer link"}
              </button>
              <Link
                to="/sign/$token"
                params={{ token: row.token }}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                Openen
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const label =
    status === "signed"
      ? "Ondertekend"
      : status === "sent"
        ? "Wacht op ondertekening"
        : status === "missing"
          ? "Niet gevonden"
          : "…";

  const tone =
    status === "signed"
      ? "bg-primary/10 text-primary"
      : status === "sent"
        ? "bg-muted text-muted-foreground"
        : "bg-destructive/10 text-destructive";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
  );
}
