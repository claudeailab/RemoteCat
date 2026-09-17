import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/encryption";
import Stripe from "stripe";

export async function POST() {
  await requireAdmin();
  const secretKey = await getSetting("stripe_secretKey");
  if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  try {
    const stripe = new Stripe(secretKey);
    await stripe.balance.retrieve();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Connection failed" }, { status: 400 });
  }
}
