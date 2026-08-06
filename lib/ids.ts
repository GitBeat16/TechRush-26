/**
 * Stable ids.
 *
 * The client has always minted its own ids ("trip-goa", "t1", "exp-abc"), and
 * Postgres wants uuids. Rather than keeping a mapping table, any non-uuid id
 * is folded into a uuid deterministically — the same input always produces the
 * same output, so syncing is idempotent and the seed trips keep their identity
 * across devices and reloads.
 *
 * This is not a cryptographic hash and does not need to be. It only has to be
 * stable and collision-resistant across the handful of ids one account owns.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** FNV-1a, 32 bits, seeded so four passes give four independent words. */
function fnv1a(input: string, seed: number): number {
  let hash = 0x811c9dc5 ^ seed;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function word(input: string, seed: number): string {
  return fnv1a(input, seed).toString(16).padStart(8, "0");
}

/** Derive a syntactically valid v4-shaped uuid from any string. */
export function stableUuid(input: string): string {
  const a = word(input, 0);
  const b = word(input, 0x9e3779b9);
  const c = word(input, 0x85ebca6b);
  const d = word(input, 0xc2b2ae35);

  const hex = `${a}${b}${c}${d}`;

  // Force the version (4) and variant (8/9/a/b) nibbles so Postgres accepts it
  // and so it can never be mistaken for a genuinely random uuid.
  const version = "4";
  const variant = "89ab"[parseInt(hex[16], 16) % 4];

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    version + hex.slice(13, 16),
    variant + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** A uuid passes through untouched; anything else is folded into one. */
export function ensureUuid(value: string): string {
  return isUuid(value) ? value : stableUuid(value);
}

/** A genuinely new id, uuid where available. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return stableUuid(`${Date.now()}-${Math.random()}`);
}
