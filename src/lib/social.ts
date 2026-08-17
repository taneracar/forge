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

/**
 * Completion timestamps for someone else's heatmap. Comes back empty both
 * when the user has no sessions and when they've turned activity sharing
 * off — the caller can't tell the difference, which is the point.
 */
export async function getPublicActivity(profileId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_public_activity", {
    profile_id: profileId,
  });
  if (error) throw error;
  return ((data ?? []) as { completed_at: string }[]).map((r) => r.completed_at);
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface FollowState {
  /** You follow them. */
  following: boolean;
  /** They follow you. */
  followsYou: boolean;
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not signed in");
  return data.user.id;
}

export async function followUser(followeeId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: await currentUserId(), followee_id: followeeId });
  if (error) throw error;
}

export async function unfollowUser(followeeId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", await currentUserId())
    .eq("followee_id", followeeId);
  if (error) throw error;
}

/**
 * Read straight from `follows` rather than through an RPC: the table's own
 * policy already exposes exactly the two edges that can exist between you and
 * them, and nothing else. The pair of `in` filters selects both ends at once
 * without building an `or` string out of ids.
 */
export async function getFollowState(profileId: string): Promise<FollowState> {
  const me = await currentUserId();
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, followee_id")
    .in("follower_id", [me, profileId])
    .in("followee_id", [me, profileId]);
  if (error) throw error;

  const rows = (data ?? []) as { follower_id: string; followee_id: string }[];
  return {
    following: rows.some((r) => r.follower_id === me && r.followee_id === profileId),
    followsYou: rows.some((r) => r.follower_id === profileId && r.followee_id === me),
  };
}

/** Null when the profile is blocked in either direction — not zeroes. */
export async function getFollowCounts(profileId: string): Promise<FollowCounts | null> {
  const { data, error } = await supabase.rpc("get_follow_counts", {
    profile_id: profileId,
  });
  if (error) throw error;
  const row = ((data ?? []) as FollowCounts[])[0];
  return row ?? null;
}

export async function listFollowers(profileId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc("list_followers", { profile_id: profileId });
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function listFollowing(profileId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc("list_following", { profile_id: profileId });
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

/** Opt out of showing your activity heatmap on your public profile. */
export async function setShareActivity(userId: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ share_activity: value })
    .eq("id", userId);
  if (error) throw error;
}

export async function blockUser(blockedId: string): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw authError ?? new Error("Not signed in");
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: data.user.id, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockedId: string): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw authError ?? new Error("Not signed in");
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", data.user.id)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

/** Whether *you* blocked them. Says nothing about the other direction — by
 *  design, being blocked is not discoverable by the blocked user. */
export async function hasBlocked(blockedId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("blocks")
    .select("blocked_id", { count: "exact", head: true })
    .eq("blocked_id", blockedId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
