import { NextResponse } from "next/server";
import { getPlatformInfo } from "@/lib/platform";

export async function GET() {
  const info = await getPlatformInfo();
  return NextResponse.json(info);
}
