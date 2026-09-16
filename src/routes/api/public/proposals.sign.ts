import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const signSchema = z.object({
  token: z.string().trim().min(10).max(80),
  fields: z.record(z.string(), z.string().max(400)),
  signatureImage: z
    .string()
    .max(1_500_000)
    .refine((v) => v.startsWith("data:image/png;base64,"), "invalid image"),
  signerName: z.string().trim().min(2).max(200),
});

export const Route = createFileRoute("/api/public/proposals/sign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid body" }, 400);
        }

        const parsed = signSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid input" }, 400);
        const { token, fields, signatureImage, signerName } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing, error: lookupError } = await supabaseAdmin
          .from("proposals")
          .select("id, status")
          .eq("share_token", token)
          .maybeSingle();

        if (lookupError) return json({ error: "lookup failed" }, 500);
        if (!existing) return json({ error: "not found" }, 404);
        if (existing.status === "signed") return json({ error: "already signed" }, 409);

        const signedAt = new Date().toISOString();
        const { error } = await supabaseAdmin
          .from("proposals")
          .update({
            status: "signed",
            signed_at: signedAt,
            signature: { fields, signatureImage, signerName },
          })
          .eq("id", existing.id);

        if (error) return json({ error: "sign failed" }, 500);
        return json({ status: "signed", signedAt });
      },
    },
  },
});
