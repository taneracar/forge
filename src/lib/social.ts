import { supabase } from "@/lib/supabase";

/**
 * The only shape of another user this app ever reads. `profiles` itself stays
 * locked to "own row only" — these come from security-definer functions that
 * project just these columns, so private fields (weight, age, goal) cannot
 * leak through discovery. See "Milestone 10" in schema.sql.
 */
export interface PublicProfile {
  id: string;
  username: string;
  name: string;
}

export async function isUsernameAvailable(candidate: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_username_available", { candidate });
  if (error) throw error;
  return data === true;
}

/** Returns nothing for queries under 2 characters — also enforced server-side. */
export async function searchProfiles(
  query: string,
  maxResults = 20,
): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc("search_profiles", {
    query,
    max_results: maxResults,
  });
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function getPublicProfile(
  profileId: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile", {
    profile_id: profileId,
  });
  if (error) throw error;
  return ((data ?? []) as PublicProfile[])[0] ?? null;
}
