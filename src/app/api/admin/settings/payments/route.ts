import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/encryption";

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
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { publishableKey, secretKey, webhookSecret, liveMode } = parsed.data;
  await setSetting("stripe_liveMode", String(liveMode));
  if (publishableKey) await setSetting("stripe_publishableKey", publishableKey);
  if (secretKey) await setSetting("stripe_secretKey", secretKey);
  if (webhookSecret) await setSetting("stripe_webhookSecret", webhookSecret);
  return NextResponse.json({ ok: true });
}
