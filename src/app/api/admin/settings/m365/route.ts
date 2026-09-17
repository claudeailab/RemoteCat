import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/encryption";

const schema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  tenantId: z.string(),
  expiryDate: z.string().optional(),
  reminderDays: z.coerce.number().int().min(1).max(365).optional(),
});

export async function GET() {
  await requireAdmin();
  const clientId = await getSetting("m365_clientId");
  const tenantId = await getSetting("m365_tenantId");
  const expiryDate = await getSetting("m365_expiryDate");
  const reminderDays = await getSetting("m365_reminderDays");
  return NextResponse.json({ data: { clientId: clientId ?? "", tenantId: tenantId ?? "", expiryDate: expiryDate ?? "", reminderDays: reminderDays ?? "30" } });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { clientId, clientSecret, tenantId, expiryDate, reminderDays } = parsed.data;
  await setSetting("m365_clientId", clientId);
  if (clientSecret) await setSetting("m365_clientSecret", clientSecret);
  await setSetting("m365_tenantId", tenantId);
  if (expiryDate) await setSetting("m365_expiryDate", expiryDate);
  if (reminderDays) await setSetting("m365_reminderDays", String(reminderDays));
  return NextResponse.json({ ok: true });
}
