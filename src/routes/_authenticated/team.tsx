import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import type { MemberStatus } from "@/lib/team.functions";
import { listTeam, setMemberStatus, transferOwnership } from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Teambeheer — MSP Voorstellen" },
      {
        name: "description",
        content: "Keur toegangsaanvragen goed, deactiveer teamleden en draag het eigenaarschap over.",
      },
      { property: "og:title", content: "Teambeheer" },
      { property: "og:description", content: "Beheer wie toegang heeft tot de omgeving." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

const statusLabel: Record<MemberStatus, string> = {
  pending: "Wacht op goedkeuring",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  deactivated: "Gedeactiveerd",
};

function TeamPage() {
  const queryClient = useQueryClient();
  const load = useServerFn(listTeam);
  const setStatus = useServerFn(setMemberStatus);
  const transfer = useServerFn(transferOwnership);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team"],
    queryFn: () => load({ data: undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { userId: string; status: MemberStatus }) => setStatus({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const transferMutation = useMutation({
    mutationFn: (userId: string) => transfer({ data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["access"] });
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Teambeheer</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Nieuwe aanvragen krijgen pas toegang nadat u ze hier goedkeurt.
      </p>

      <div className="mt-8 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
        {isError && (
          <p className="text-sm text-destructive">Alleen de eigenaar kan het team beheren.</p>
        )}

        {(data ?? []).map((member) => (
          <article
            key={member.userId}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-card-foreground">
                {member.email || "onbekend e-mailadres"}
                {member.isOwner && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Eigenaar
                  </span>
                )}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{statusLabel[member.status]}</p>
            </div>

            {!member.isOwner && (
              <div className="flex flex-wrap items-center gap-2">
                {member.status !== "approved" && (
                  <button
                    onClick={() =>
                      statusMutation.mutate({ userId: member.userId, status: "approved" })
                    }
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Goedkeuren
                  </button>
                )}
                {member.status === "pending" && (
                  <button
                    onClick={() =>
                      statusMutation.mutate({ userId: member.userId, status: "rejected" })
                    }
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Afwijzen
                  </button>
                )}
                {member.status === "approved" && (
                  <>
                    <button
                      onClick={() =>
                        statusMutation.mutate({ userId: member.userId, status: "deactivated" })
                      }
                      className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-accent"
                    >
                      Deactiveren
                    </button>
                    <button
                      onClick={() => {
                        const ok = window.confirm(
                          `Eigenaarschap overdragen aan ${member.email}? U blijft teamlid, maar verliest het beheer.`,
                        );
                        if (ok) transferMutation.mutate(member.userId);
                      }}
                      className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      Eigenaar maken
                    </button>
                  </>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
