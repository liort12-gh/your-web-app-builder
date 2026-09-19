import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProposalSummary = {
  id: string;
  name: string;
  docType: "merchant" | "partner";
  updatedAt: string;
};

/**
 * Every proposal belongs to the authenticated user's stable id, and every read
 * and write below is filtered on that id server-side. Changing an id in a
 * request can never reach another member's proposal.
 */
async function approvedClient(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >;
  const { data, error } = await supabase
    .from("team_members")
    .select("status")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error || data?.status !== "approved") throw new Error("Geen toegang");
  return supabase;
}

export const listMyProposals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProposalSummary[]> => {
    const supabase = await approvedClient(context);
    const { data, error } = await supabase
      .from("proposals")
      .select("client_id, title, doc_type, updated_at")
      .eq("owner_id", context.userId)
      .not("client_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error("Kon voorstellen niet laden");
    return (data ?? []).map((p) => ({
      id: p.client_id as string,
      name: p.title,
      docType: p.doc_type === "partner" ? "partner" : "merchant",
      updatedAt: p.updated_at,
    }));
  });

export const getMyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = await approvedClient(context);
    const { data: row, error } = await supabase
      .from("proposals")
      .select("client_id, title, doc_type, payload, updated_at")
      .eq("owner_id", context.userId)
      .eq("client_id", data.id)
      .maybeSingle();
    if (error) throw new Error("Laden mislukt");
    if (!row) return null;
    return {
      id: row.client_id as string,
      name: row.title,
      docType: row.doc_type === "partner" ? "partner" : "merchant",
      payload: String(row.payload),
      updatedAt: row.updated_at,
    };
  });

export const saveMyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; name: string; docType: string; payload: string }) =>
      z
        .object({
          id: z.string().trim().min(1).max(120),
          name: z.string().trim().min(1).max(200),
          docType: z.enum(["merchant", "partner"]),
          payload: z.string().min(2).max(4_000_000),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = await approvedClient(context);
    const { data: existing } = await supabase
      .from("proposals")
      .select("id")
      .eq("owner_id", context.userId)
      .eq("client_id", data.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("proposals")
        .update({ title: data.name, doc_type: data.docType, payload: data.payload })
        .eq("id", existing.id)
        .eq("owner_id", context.userId);
      if (error) throw new Error("Opslaan mislukt");
      return { ok: true };
    }

    const { error } = await supabase.from("proposals").insert({
      owner_id: context.userId,
      client_id: data.id,
      title: data.name,
      doc_type: data.docType,
      payload: data.payload,
    });
    if (error) throw new Error("Opslaan mislukt");
    return { ok: true };
  });

export const deleteMyProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = await approvedClient(context);
    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("owner_id", context.userId)
      .eq("client_id", data.id);
    if (error) throw new Error("Verwijderen mislukt");
    return { ok: true };
  });
