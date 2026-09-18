import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { permission_groups, users } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

const groupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  await requireAdmin();
  const rows = await db
    .select({
      id: permission_groups.id,
      name: permission_groups.name,
      description: permission_groups.description,
      permissions: permission_groups.permissions,
      isDefault: permission_groups.isDefault,
      createdAt: permission_groups.createdAt,
      userCount: count(users.id),
    })
    .from(permission_groups)
    .leftJoin(users, eq(users.groupId, permission_groups.id))
    .groupBy(permission_groups.id)
    .limit(100);

  return NextResponse.json({
    groups: rows.map(r => ({
      ...r,
      permissions: JSON.parse(r.permissions || "[]") as string[],
    })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, description, permissions, isDefault } = parsed.data;

  if (isDefault) {
    await db.update(permission_groups).set({ isDefault: false });
  }

  await db.insert(permission_groups).values({
    name, description, permissions: JSON.stringify(permissions), isDefault,
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "create", resource: "group", detail: `name=${name}`, ip });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, description, permissions, isDefault } = parsed.data;

  if (isDefault) {
    await db.update(permission_groups).set({ isDefault: false }).where(sql`id != ${id}`);
  }

  await db.update(permission_groups)
    .set({ name, description, permissions: JSON.stringify(permissions), isDefault })
    .where(eq(permission_groups.id, id));

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "update", resource: "group", detail: `id=${id}; name=${name}`, ip });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Unassign users from this group before deleting
  await db.update(users).set({ groupId: null }).where(eq(users.groupId, id));
  await db.delete(permission_groups).where(eq(permission_groups.id, id));

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAudit({ userEmail: admin.email, action: "delete", resource: "group", detail: `id=${id}`, ip });
  return NextResponse.json({ ok: true });
}
