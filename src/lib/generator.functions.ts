import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The generator document is only handed out to approved, signed-in members. */
export const getGeneratorHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string> => {
    const { data, error } = await context.supabase
      .from("team_members")
      .select("status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || data?.status !== "approved") throw new Error("Geen toegang");

    const { getGeneratorDocument } = await import("@/generator/generator-html.server");
    return getGeneratorDocument();
  });
