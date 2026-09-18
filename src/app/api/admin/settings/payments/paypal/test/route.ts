import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/encryption";

export async function POST() {
  await requireAdmin();
  const [clientId, clientSecret, liveMode] = await Promise.all([
    getSetting("paypal_clientId"),
    getSetting("paypal_clientSecret"),
    getSetting("paypal_liveMode"),
  ]);
  if (!clientId || !clientSecret) return NextResponse.json({ error: "PayPal not configured" }, { status: 400 });

  const url = liveMode === "true"
    ? "https://api-m.paypal.com/v1/oauth2/token"
    : "https://api-m.sandbox.paypal.com/v1/oauth2/token";

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return NextResponse.json({ error: `Auth failed (${res.status})` }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Connection failed" }, { status: 400 });
  }
}
