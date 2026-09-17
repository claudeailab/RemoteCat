import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const planSchema = z.object({ name: z.string().min(1), monthlyPrice: z.number().int().min(0), yearlyPrice: z.number().int().min(0), features: z.string().default("[]") });
const updateSchema = planSchema.extend({ id: z.number().int().positive() });

export async function GET() {
  await requireAdmin();
  const list = await db.select().from(plans).limit(50);
  return NextResponse.json({ plans: list });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.insert(plans).values(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, name, monthlyPrice, yearlyPrice, features } = parsed.data;
  await db.update(plans).set({
    name: sql`${name}`,
    monthlyPrice: sql`${monthlyPrice}`,
    yearlyPrice: sql`${yearlyPrice}`,
    features: sql`${features}`,
  }).where(eq(plans.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.delete(plans).where(eq(plans.id, id));
  return NextResponse.json({ ok: true });
}
