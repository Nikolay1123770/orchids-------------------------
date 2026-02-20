import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";
import { getClientTraffic } from "@/lib/server/xui";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    let clientTraffic = { up: 0, down: 0 };
    try {
      const data = await getClientTraffic(user.xui_email);
      if (data?.obj) clientTraffic = { up: data.obj.up || 0, down: data.obj.down || 0 };
    } catch {
      // xui unreachable
    }

    return NextResponse.json({ success: true, client: clientTraffic });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
