import type { BusinessBooks, BusinessTrackerState } from "@/lib/business-tracker";

/**
 * Fresh installations start empty. The user's imported workbook was migrated once into the
 * encrypted business_operations_v1 Supabase record and is deliberately not kept in public source.
 */
export function createSeedBooks(): BusinessBooks {
  return {
    sourceName: "Web business manager",
    importedAt: "",
    phones: [],
    expenses: [],
    businessSpend: [],
    suppliers: [],
    customers: [],
  };
}

type EncryptedEnvelope = { v: 1; iv: string; tag: string; data: string };

async function encryptionKey() {
  const { createHash } = await import("node:crypto");
  const source =
    process.env.BUSINESS_TRACKER_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!source) throw new Error("Business tracker encryption is not configured");
  return createHash("sha256").update(source).digest();
}

export async function encryptTrackerState(state: BusinessTrackerState): Promise<EncryptedEnvelope> {
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(state), "utf8"), cipher.final()]);
  return {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

export async function decryptTrackerState(envelope: EncryptedEnvelope): Promise<unknown> {
  const { createDecipheriv } = await import("node:crypto");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    await encryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(envelope.data, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  );
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.v === 1 &&
    typeof record.iv === "string" &&
    typeof record.tag === "string" &&
    typeof record.data === "string"
  );
}
