export type AuthProvider = "email" | "google";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarId: string;
  homeCity: string;
  provider: AuthProvider;
  createdAt: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthSnapshot {
  status: AuthStatus;
  user: UserProfile | null;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  avatarId: string;
  homeCity?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ProfilePatch {
  name?: string;
  avatarId?: string;
  homeCity?: string;
}

/** A demo identity offered by the simulated Google chooser. */
export interface GoogleDemoAccount {
  email: string;
  name: string;
  avatarId: string;
  homeCity: string;
}
