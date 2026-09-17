import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({ email: z.string().email(), displayName: z.string().optional(), password: z.string().min(8), role: z.enum(["user", "admin"]) });
const updateSchema = z.object({ id: z.number().int().positive(), email: z.string().email().optional(), displayName: z.string().optional(), password: z.string().min(8).optional(), role: z.enum(["user", "admin"]).optional() });

export async function GET() {
  await requireAdmin();
  const list = await db.select({ id: users.id, email: users.email, displayName: users.displayName, role: users.role, source: users.source })
    .from(users).limit(100);
  return NextResponse.json({ users: list });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, displayName, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, displayName, passwordHash, role, source: "local" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "create", resource: "user", detail: `email=${email} role=${role}`, ip });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, email, displayName, password, role } = parsed.data;
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

  type UpdateSet = Parameters<ReturnType<typeof db.update<typeof users>>["set"]>[0];
  const set: UpdateSet = {};
  if (email) set.email = sql`${email}`;
  if (displayName !== undefined) set.displayName = sql`${displayName}`;
  if (role) set.role = sql`${role}`;
  if (passwordHash) set.passwordHash = sql`${passwordHash}`;
  if (Object.keys(set).length === 0) return NextResponse.json({ ok: true });
  await db.update(users).set(set).where(eq(users.id, id));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "update", resource: "user", detail: `id=${id}`, ip });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(users).where(eq(users.id, id));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "delete", resource: "user", detail: `id=${id}`, ip });
  return NextResponse.json({ ok: true });
}
