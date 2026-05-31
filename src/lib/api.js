import { supabase } from "./supabase";

/* Drop-in replacement for the local `dataLayer` in GPUMatchmaker.jsx:
 *     import { loadData, updateRequirement } from "./lib/api";
 *     const dataLayer = { loadData, updateRequirement };
 * Shapes match the seed data exactly, so no view/scoring code changes. */

export async function loadData() {
  const [reqRes, invRes] = await Promise.all([
    supabase.from("requirements").select("*, blacklist(provider)").order("id"),
    supabase.from("inventory").select("*").order("id"),
  ]);
  if (reqRes.error) throw reqRes.error;
  if (invRes.error) throw invRes.error;

  // flatten the blacklist relation -> array of provider strings the matcher expects
  const requirements = reqRes.data.map(r => ({
    ...r,
    blacklist: (r.blacklist || []).map(b => b.provider),
  }));
  return { requirements, inventory: invRes.data };
}

/* Optimistic concurrency: the write lands only if the row hasn't changed since
 * it was loaded. `expectedUpdatedAt` is the updated_at the UI is holding.
 * 0 rows back => someone edited it first; we surface the fresh row and signal
 * CONFLICT so the UI can prompt a reload instead of silently clobbering. */
export async function updateRequirement(id, patch, expectedUpdatedAt) {
  const { data, error } = await supabase
    .from("requirements")
    .update(patch)                    // do NOT send updated_at — the DB trigger sets it
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: fresh } = await supabase.from("requirements").select("*").eq("id", id).single();
    const err = new Error("Row changed since load");
    err.code = "CONFLICT";
    err.fresh = fresh;
    throw err;
  }
  return data;                        // includes the new server-set updated_at
}

export async function updateInventory(id, patch, expectedUpdatedAt) {
  const { data, error } = await supabase
    .from("inventory")
    .update(patch)
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: fresh } = await supabase.from("inventory").select("*").eq("id", id).single();
    const err = new Error("Row changed since load");
    err.code = "CONFLICT";
    err.fresh = fresh;
    throw err;
  }
  return data;
}
