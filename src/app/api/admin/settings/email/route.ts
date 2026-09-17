import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/encryption";

const schema = z.object({
  host: z.string(),
  port: z.coerce.number().int().min(1).max(65535),
  ssl: z.boolean(),
  user: z.string(),
  password: z.string(),
  fromName: z.string(),
  fromEmail: z.string().email(),
});

export async function GET() {
  await requireAdmin();
  const host = await getSetting("smtp_host");
  const port = await getSetting("smtp_port");
  const ssl = await getSetting("smtp_ssl");
  const fromName = await getSetting("smtp_fromName");
  const fromEmail = await getSetting("smtp_fromEmail");
  return NextResponse.json({ data: { host: host ?? "", port: port ?? "587", ssl: ssl === "true", fromName: fromName ?? "", fromEmail: fromEmail ?? "" } });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { host, port, ssl, user, password, fromName, fromEmail } = parsed.data;
  await Promise.all([
    setSetting("smtp_host", host),
    setSetting("smtp_port", String(port)),
    setSetting("smtp_ssl", String(ssl)),
    user ? setSetting("smtp_user", user) : Promise.resolve(),
    password ? setSetting("smtp_password", password) : Promise.resolve(),
    setSetting("smtp_fromName", fromName),
    setSetting("smtp_fromEmail", fromEmail),
  ]);
  return NextResponse.json({ ok: true });
}
