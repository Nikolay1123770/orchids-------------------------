import { NextResponse } from "next/server";
import { PLANS } from "@/lib/server/constants";

export async function GET() {
  return NextResponse.json({ success: true, plans: PLANS });
}
