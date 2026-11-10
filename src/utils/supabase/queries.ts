import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function fetchActiveOrganizations(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function fetchActiveVenues(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
