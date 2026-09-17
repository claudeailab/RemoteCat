import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/encryption";

const schema = z.object({ provider: z.enum(["anthropic", "openai"]) });

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { provider } = parsed.data;
  const apiKey = await getSetting(`${provider}_apiKey`);
  const model = await getSetting(`${provider}_model`);
  if (!apiKey) return NextResponse.json({ error: `${provider} API key not configured` }, { status: 400 });

  try {
    if (provider === "anthropic") {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      await client.messages.create({ model: model ?? "claude-sonnet-4-6", max_tokens: 1, messages: [{ role: "user", content: "hi" }] });
    } else {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey });
      await client.chat.completions.create({ model: model ?? "gpt-4o", max_tokens: 1, messages: [{ role: "user", content: "hi" }] });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Connection failed" }, { status: 400 });
  }
}
