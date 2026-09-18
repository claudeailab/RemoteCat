import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/encryption";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ConfidentialClientApplication } from "@azure/msal-node";

interface GraphUser {
  id: string;
  mail: string | null;
  userPrincipalName: string;
  displayName: string | null;
}

export async function GET() {
  await requireAdmin();

  const clientId = await getSetting("m365_clientId");
  const clientSecret = await getSetting("m365_clientSecret");
  const tenantId = await getSetting("m365_tenantId");
  if (!clientId || !clientSecret || !tenantId) {
    return NextResponse.json({ error: "M365 not configured" }, { status: 400 });
  }

  const app = new ConfidentialClientApplication({
    auth: { clientId, clientSecret, authority: `https://login.microsoftonline.com/${tenantId}` },
  });
  const token = await app.acquireTokenByClientCredential({ scopes: ["https://graph.microsoft.com/.default"] });
  if (!token?.accessToken) return NextResponse.json({ error: "Could not get token" }, { status: 400 });

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/users?$select=id,mail,userPrincipalName,displayName&$top=999",
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );
  const data = await res.json() as { value: GraphUser[] };
  const directoryUsers = data.value ?? [];

  const platformUsers = await db
    .select({ azureOid: users.azureOid, id: users.id, groupId: users.groupId })
    .from(users)
    .where(eq(users.source, "azure"));

  const oidMap = new Map(platformUsers.map(u => [u.azureOid, u]));

  return NextResponse.json({
    users: directoryUsers
      .map(u => {
        const email = u.mail ?? u.userPrincipalName;
        const platform = oidMap.get(u.id);
        return {
          oid: u.id,
          email,
          displayName: u.displayName,
          inPlatform: !!platform,
          userId: platform?.id ?? null,
          groupId: platform?.groupId ?? null,
        };
      })
      .filter(u => u.email),
  });
}
