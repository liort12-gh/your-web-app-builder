import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const createSchema = z.object({
  title: z.string().trim().min(1).max(200).default("Voorstel"),
  docType: z.enum(["merchant", "partner"]).default("merchant"),
  payload: z.string().min(2).max(4_000_000),
  shareToken: z.string().trim().min(10).max(80).optional(),
});

function newToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/proposals")({
  server: {
    handlers: {
      // Prospect (or the creator) opens a shared proposal by its secret link.
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token")?.trim();
        if (!token) return json({ error: "missing token" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("proposals")
          .select("title, doc_type, payload, status, signature, signed_at, updated_at")
          .eq("share_token", token)
          .maybeSingle();

        if (error) return json({ error: "lookup failed" }, 500);
        if (!data) return json({ error: "not found" }, 404);

        return json({
          title: data.title,
          docType: data.doc_type,
          payload: data.payload,
          status: data.status,
          signature: data.signature,
          signedAt: data.signed_at,
          updatedAt: data.updated_at,
        });
      },

      // Create a share link, or refresh the content behind an existing one.
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid body" }, 400);
        }

        const parsed = createSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid input" }, 400);
        const { title, docType, payload, shareToken } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (shareToken) {
          const { data: existing } = await supabaseAdmin
            .from("proposals")
            .select("id, status")
            .eq("share_token", shareToken)
            .maybeSingle();

          if (existing) {
            if (existing.status === "signed") {
              return json({ error: "already signed" }, 409);
            }
            const { error } = await supabaseAdmin
              .from("proposals")
              .update({ title, doc_type: docType, payload })
              .eq("id", existing.id);
            if (error) return json({ error: "save failed" }, 500);
            return json({ shareToken, status: "sent" });
          }
        }

        const token = newToken();
        const { error } = await supabaseAdmin
          .from("proposals")
          .insert({ share_token: token, title, doc_type: docType, payload });
        if (error) return json({ error: "save failed" }, 500);

        return json({ shareToken: token, status: "sent" });
      },
    },
  },
});
