import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { DEFAULT_AVATAR_ID, avatarForSeed, isAvatarId } from "@/lib/avatars";
import { hashPassword } from "@/lib/server/password";
import type { AuthProvider, UserProfile } from "@/types/auth";

/* ------------------------------------------------------------------ */
/* User store                                                          */
/*                                                                     */
/* A JSON file, read once into memory and written atomically. That is  */
/* enough for local development and a single-instance deploy.          */
/*                                                                     */
/* Swapping in a database means reimplementing the six exported        */
/* functions below — nothing else in the app touches storage.          */
/* Serverless platforms have a read-only filesystem, so a real deploy  */
/* needs that swap. See docs/AUTH.md.                                  */
/* ------------------------------------------------------------------ */

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarId: string;
  homeCity: string;
  provider: AuthProvider;
  createdAt: string;
  /** email accounts only */
  passwordHash?: string;
  /** google accounts only — the stable `sub` claim */
  googleId?: string;
  picture?: string;
}

const DATA_DIR = process.env.WANDERLY_DATA_DIR ?? path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "users.json");

const DEMO_EMAIL = "srushti@wanderly.app";
const DEMO_PASSWORD = "wanderly";

let cache: UserRecord[] | null = null;
let writing: Promise<void> = Promise.resolve();

async function readAll(): Promise<UserRecord[]> {
  if (cache) return cache;

  try {
    const raw = await readFile(FILE, "utf8");
    cache = JSON.parse(raw) as UserRecord[];
  } catch {
    cache = [];
  }

  // Seed a demo account the first time so the app is explorable immediately.
  if (!cache.some((user) => user.email === DEMO_EMAIL)) {
    cache.push({
      id: "user-demo",
      email: DEMO_EMAIL,
      name: "Srushti Kalokhe",
      avatarId: "citypop",
      homeCity: "Bengaluru",
      provider: "email",
      createdAt: "2023-04-02",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    });
    await flush();
  }

  return cache;
}

/** Serialised, atomic write: temp file then rename. */
async function flush(): Promise<void> {
  const snapshot = cache ? [...cache] : [];
  writing = writing.then(async () => {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      const temp = `${FILE}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(snapshot, null, 2), "utf8");
      await rename(temp, FILE);
    } catch (error) {
      console.error("[users] could not persist:", error);
    }
  });
  return writing;
}

/* ------------------------------- api -------------------------------- */

export function toProfile(user: UserRecord): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarId: user.avatarId,
    homeCity: user.homeCity,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

export async function findByEmail(email: string): Promise<UserRecord | undefined> {
  const users = await readAll();
  const needle = email.trim().toLowerCase();
  return users.find((user) => user.email === needle);
}

export async function findById(id: string): Promise<UserRecord | undefined> {
  const users = await readAll();
  return users.find((user) => user.id === id);
}

export async function createEmailUser(input: {
  name: string;
  email: string;
  password: string;
  avatarId?: string;
  homeCity?: string;
}): Promise<UserRecord> {
  const users = await readAll();
  const email = input.email.trim().toLowerCase();

  const user: UserRecord = {
    id: `user-${randomUUID()}`,
    email,
    name: input.name.trim(),
    avatarId: isAvatarId(input.avatarId) ? input.avatarId : DEFAULT_AVATAR_ID,
    homeCity: input.homeCity?.trim() ?? "",
    provider: "email",
    createdAt: new Date().toISOString().slice(0, 10),
    passwordHash: await hashPassword(input.password),
  };

  users.push(user);
  await flush();
  return user;
}

/** Find or create the account behind a verified Google identity. */
export async function upsertGoogleUser(input: {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<UserRecord> {
  const users = await readAll();
  const email = input.email.trim().toLowerCase();

  const existing =
    users.find((user) => user.googleId === input.googleId) ??
    users.find((user) => user.email === email);

  if (existing) {
    // Link the Google identity to an account that started as email/password.
    existing.googleId = input.googleId;
    existing.picture = input.picture ?? existing.picture;
    if (!existing.name && input.name) existing.name = input.name;
    await flush();
    return existing;
  }

  const user: UserRecord = {
    id: `user-${randomUUID()}`,
    email,
    name: input.name?.trim() || email.split("@")[0],
    avatarId: avatarForSeed(input.googleId),
    homeCity: "",
    provider: "google",
    createdAt: new Date().toISOString().slice(0, 10),
    googleId: input.googleId,
    picture: input.picture,
  };

  users.push(user);
  await flush();
  return user;
}

export async function updateUser(
  id: string,
  patch: { name?: string; avatarId?: string; homeCity?: string },
): Promise<UserRecord | undefined> {
  const users = await readAll();
  const user = users.find((entry) => entry.id === id);
  if (!user) return undefined;

  if (patch.name !== undefined) user.name = patch.name.trim();
  if (patch.homeCity !== undefined) user.homeCity = patch.homeCity.trim();
  if (patch.avatarId !== undefined && isAvatarId(patch.avatarId)) {
    user.avatarId = patch.avatarId;
  }

  await flush();
  return user;
}

export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
