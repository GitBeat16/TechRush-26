import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt — memory-hard, built into Node, no dependency.
 * Stored as `scrypt$N$r$p$saltHex$hashHex` so the parameters travel with the
 * hash and can be raised later without invalidating existing accounts.
 */

// N=65536 costs about 100ms and 64MB per hash on a laptop. Slow enough to make
// offline guessing expensive, fast enough that signing in still feels instant.
const N = 65536; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelisation
const KEY_LENGTH = 64;
const MAX_MEM = 192 * 1024 * 1024; // must exceed N * r * 128

function derive(
  password: string,
  salt: Buffer,
  cost = N,
  blockSize = R,
  parallel = P,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      { N: cost, r: blockSize, p: parallel, maxmem: MAX_MEM },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined,
): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  // Read the parameters back off the hash, so accounts created under older
  // settings keep working after the cost is raised.
  const [, cost, blockSize, parallel, saltHex, hashHex] = parts;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = await derive(
      password,
      salt,
      Number(cost),
      Number(blockSize),
      Number(parallel),
    );

    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
