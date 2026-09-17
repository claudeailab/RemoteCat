import crypto from "crypto";

const KEY = Buffer.from(process.env.REMOTE_CAT_ENCRYPTION_KEY ?? "", "hex");
const ALGO = "aes-256-gcm";

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(":");
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(dataHex, "hex")) + decipher.final("utf8");
}

export async function getSetting(key: string): Promise<string | null> {
  const { db } = await import("./db");
  const { remotecat_settings } = await import("./db/schema");
  const { eq } = await import("drizzle-orm");
  const [row] = await db.select({ value: remotecat_settings.value }).from(remotecat_settings).where(eq(remotecat_settings.key, key)).limit(1);
  if (!row) return null;
  try { return decrypt(row.value); } catch { return null; }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { db } = await import("./db");
  const { remotecat_settings } = await import("./db/schema");
  const { sql } = await import("drizzle-orm");
  const encrypted = encrypt(value);
  await db.insert(remotecat_settings).values({ key, value: encrypted })
    .onDuplicateKeyUpdate({ set: { value: sql`values(value)`, updatedAt: sql`now()` } });
}
