import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MemberStatus = "pending" | "approved" | "rejected" | "deactivated";

export type Access = {
  userId: string;
  email: string;
  status: MemberStatus;
  isOwner: boolean;
};

export type Member = Access & { createdAt: string; updatedAt: string };

/**
 * Membership is keyed on the identity provider's stable user id, never on an
 * email address, so the app can move to another identity provider later.
 */
export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Access> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("user_id, email, status, is_owner")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return {
        userId,
        email: existing.email,
        status: existing.status as MemberStatus,
        isOwner: existing.is_owner,
      };
    }

    // First ever member becomes the application owner. No email is hard-coded.
    const { count } = await supabaseAdmin
      .from("team_members")
      .select("user_id", { count: "exact", head: true });
    const bootstrap = (count ?? 0) === 0;

    const row = {
      user_id: userId,
      email,
      status: (bootstrap ? "approved" : "pending") as MemberStatus,
      is_owner: bootstrap,
    };
    const { error } = await supabaseAdmin.from("team_members").insert(row);
    if (error && error.code !== "23505") throw new Error("Kon lidmaatschap niet vastleggen");

    return { userId, email, status: row.status, isOwner: row.is_owner };
  });

async function assertOwner(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("team_members")
    .select("is_owner, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.is_owner || data.status !== "approved") throw new Error("Geen toegang");
  return supabaseAdmin;
}

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Member[]> => {
    const supabaseAdmin = await assertOwner(context.userId);
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select("user_id, email, status, is_owner, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Kon teamleden niet laden");
    return (data ?? []).map((m) => ({
      userId: m.user_id,
      email: m.email,
      status: m.status as MemberStatus,
      isOwner: m.is_owner,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; status: MemberStatus }) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "deactivated"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertOwner(context.userId);
    if (data.userId === context.userId) throw new Error("U kunt uw eigen status niet wijzigen");

    const { data: target } = await supabaseAdmin
      .from("team_members")
      .select("is_owner")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!target) throw new Error("Teamlid niet gevonden");
    if (target.is_owner) throw new Error("De eigenaar kan niet worden gewijzigd");

    const { error } = await supabaseAdmin
      .from("team_members")
      .update({ status: data.status })
      .eq("user_id", data.userId);
    if (error) throw new Error("Bijwerken mislukt");
    return { ok: true };
  });

export const transferOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertOwner(context.userId);
    if (data.userId === context.userId) throw new Error("U bent al eigenaar");

    const { data: target } = await supabaseAdmin
      .from("team_members")
      .select("status")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (!target || target.status !== "approved") {
      throw new Error("Alleen een goedgekeurd teamlid kan eigenaar worden");
    }

    // Release first: only one owner may exist at a time.
    const release = await supabaseAdmin
      .from("team_members")
      .update({ is_owner: false })
      .eq("user_id", context.userId);
    if (release.error) throw new Error("Overdracht mislukt");

    const claim = await supabaseAdmin
      .from("team_members")
      .update({ is_owner: true })
      .eq("user_id", data.userId);
    if (claim.error) {
      await supabaseAdmin
        .from("team_members")
        .update({ is_owner: true })
        .eq("user_id", context.userId);
      throw new Error("Overdracht mislukt");
    }
    return { ok: true };
  });
