import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";

import { getGeneratorHtml } from "@/lib/generator.functions";
import {
  deleteMyProposal,
  getMyProposal,
  listMyProposals,
  saveMyProposal,
} from "@/lib/proposals.functions";

export const Route = createFileRoute("/_authenticated/generator")({
  validateSearch: (search: Record<string, unknown>) => ({
    open: typeof search.open === "string" ? search.open : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Voorstel maken — MSP Voorstellen" },
      {
        name: "description",
        content:
          "Stel merchant- en partnervoorstellen samen met tarieven, voorwaarden en PDF-export.",
      },
      { property: "og:title", content: "Voorstel maken" },
      {
        property: "og:description",
        content: "Interne generator voor merchant- en partnervoorstellen.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeneratorPage,
});

type Op = "list" | "get" | "save" | "delete";

function GeneratorPage() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const queryClient = useQueryClient();

  const fetchHtml = useServerFn(getGeneratorHtml);
  const list = useServerFn(listMyProposals);
  const get = useServerFn(getMyProposal);
  const save = useServerFn(saveMyProposal);
  const remove = useServerFn(deleteMyProposal);

  const { data: html, isLoading, isError } = useQuery({
    queryKey: ["generator-html"],
    queryFn: () => fetchHtml({ data: undefined }),
    staleTime: Infinity,
  });

  useEffect(() => {
    async function run(op: Op, payload: Record<string, unknown>) {
      switch (op) {
        case "list":
          return await list({ data: undefined });
        case "get":
          return await get({ data: { id: String(payload.id) } });
        case "save": {
          const result = await save({
            data: {
              id: String(payload.id),
              name: String(payload.name),
              docType: payload.docType === "partner" ? "partner" : "merchant",
              payload: String(payload.payload),
            },
          });
          void queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
          return result;
        }
        case "delete": {
          const result = await remove({ data: { id: String(payload.id) } });
          void queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
          return result;
        }
        default:
          throw new Error("unsupported");
      }
    }

    async function onMessage(event: MessageEvent) {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const message = event.data as
        | { __msp?: boolean; id?: number; op?: Op; payload?: Record<string, unknown> }
        | undefined;
      if (!message?.__msp || typeof message.id !== "number" || !message.op) return;

      try {
        const result = await run(message.op, message.payload ?? {});
        frame.contentWindow?.postMessage({ __mspReply: true, id: message.id, result }, "*");
      } catch {
        frame.contentWindow?.postMessage(
          { __mspReply: true, id: message.id, error: "failed" },
          "*",
        );
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [list, get, save, remove, queryClient]);

  return (
    <main className="h-[calc(100vh-7rem)] w-full overflow-hidden rounded-lg border border-border bg-card">
      <h1 className="sr-only">Voorstel maken</h1>
      {isLoading && <p className="p-5 text-sm text-muted-foreground">Generator laden…</p>}
      {isError && (
        <p className="p-5 text-sm text-destructive">
          De generator kon niet worden geladen. Vernieuw de pagina.
        </p>
      )}
      {html && (
        <iframe
          ref={frameRef}
          srcDoc={html}
          title="MSP Proposal Generator"
          className="h-full w-full border-0"
          onLoad={() => {
            if (!openId) return;
            window.setTimeout(() => {
              frameRef.current?.contentWindow?.postMessage({ __mspOpen: openId }, "*");
            }, 600);
          }}
        />
      )}
    </main>
  );
}
