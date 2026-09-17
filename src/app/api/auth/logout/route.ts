import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("remotecat-session")?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete("remotecat-session");
  return res;
}
