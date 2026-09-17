import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit_logs } from "@/lib/db/schema";
import { desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const rows = await db.select().from(audit_logs).orderBy(desc(audit_logs.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(audit_logs);

  return NextResponse.json({ logs: rows, total, page, pages: Math.ceil(total / limit) });
}
