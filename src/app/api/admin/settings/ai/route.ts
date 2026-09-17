import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/encryption";

const schema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  apiKey: z.string().optional(),
  model: z.string(),
});

export async function GET() {
  await requireAdmin();
  const anthropicModel = await getSetting("anthropic_model");
  const openaiModel = await getSetting("openai_model");
  return NextResponse.json({ anthropicModel: anthropicModel ?? "claude-sonnet-4-6", openaiModel: openaiModel ?? "gpt-4o" });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { provider, apiKey, model } = parsed.data;
  if (apiKey) await setSetting(`${provider}_apiKey`, apiKey);
  await setSetting(`${provider}_model`, model);
  return NextResponse.json({ ok: true });
}
