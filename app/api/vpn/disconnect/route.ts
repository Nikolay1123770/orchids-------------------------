import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true, message: "Disconnected" });
}
