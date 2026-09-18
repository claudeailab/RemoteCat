import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/encryption";
import crypto from "crypto";

function getOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const clientId = await getSetting("m365_clientId");
  const tenantId = await getSetting("m365_tenantId");

  if (!clientId || !tenantId) {
    return NextResponse.redirect(new URL("/login?error=m365_not_configured", req.url));
  }

  const email = req.nextUrl.searchParams.get("email") ?? "";
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${getOrigin(req)}/api/o365/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email",
    state,
  });
  if (email) params.set("login_hint", email);

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("azure-oauth-state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
    secure: req.headers.get("x-forwarded-proto") === "https",
  });
  return res;
}
