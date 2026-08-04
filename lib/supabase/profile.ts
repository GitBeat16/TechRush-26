import type { AuthProvider, UserProfile } from "@/types/auth";

/** Row shape of the public.profiles table (see supabase/migration.sql). */
export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_id: string;
  home_city: string;
  provider: AuthProvider;
  created_at: string;
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarId: row.avatar_id,
    homeCity: row.home_city,
    provider: row.provider,
    createdAt: row.created_at,
  };
}