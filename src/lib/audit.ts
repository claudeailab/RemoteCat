import { db } from "@/lib/db";
import { audit_logs } from "@/lib/db/schema";

export async function logAudit(params: {
  userEmail?: string;
  action: string;
  resource: string;
  detail?: string;
  ip?: string;
}) {
  try {
    await db.insert(audit_logs).values(params);
  } catch {
    // Non-blocking — never let audit failure crash a request
  }
}
