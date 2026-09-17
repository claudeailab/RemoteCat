import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/encryption";
import { ConfidentialClientApplication } from "@azure/msal-node";

export async function POST() {
  await requireAdmin();
  const clientId = await getSetting("m365_clientId");
  const clientSecret = await getSetting("m365_clientSecret");
  const tenantId = await getSetting("m365_tenantId");
  if (!clientId || !clientSecret || !tenantId) {
    return NextResponse.json({ error: "M365 credentials not configured" }, { status: 400 });
  }
  try {
    const app = new ConfidentialClientApplication({ auth: { clientId, clientSecret, authority: `https://login.microsoftonline.com/${tenantId}` } });
    await app.acquireTokenByClientCredential({ scopes: ["https://graph.microsoft.com/.default"] });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Connection failed" }, { status: 400 });
  }
}
