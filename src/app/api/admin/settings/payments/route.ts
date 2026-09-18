import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  liveMode: z.boolean(),
});

export async function GET() {
  await requireAdmin();
  const liveMode = await getSetting("stripe_liveMode");
  return NextResponse.json({ data: { liveMode: liveMode === "true" } });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { publishableKey, secretKey, webhookSecret, liveMode } = parsed.data;

  const prevLiveMode = await getSetting("stripe_liveMode");
  await setSetting("stripe_liveMode", String(liveMode));
  if (publishableKey) await setSetting("stripe_publishableKey", publishableKey);
  if (secretKey) await setSetting("stripe_secretKey", secretKey);
  if (webhookSecret) await setSetting("stripe_webhookSecret", webhookSecret);

  const changes: string[] = [];
  if (String(liveMode) !== (prevLiveMode ?? "false")) changes.push(`liveMode: ${prevLiveMode ?? "false"}→${liveMode}`);
  if (publishableKey) changes.push("publishableKey: [updated]");
  if (secretKey) changes.push("secretKey: [updated]");
  if (webhookSecret) changes.push("webhookSecret: [updated]");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "update", resource: "settings.payments", detail: changes.join("; ") || "no changes", ip });
  return NextResponse.json({ ok: true });
}
