import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setPlatformInfo } from "@/lib/platform";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await setPlatformInfo(parsed.data);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  await logAudit({ action: "update", resource: "platform", ip });
  return NextResponse.json({ ok: true });
}
