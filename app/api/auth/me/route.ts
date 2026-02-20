import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getUserById, getActiveSubscription } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const sub = getActiveSubscription(userId);
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, uuid: user.uuid },
    subscription: sub
      ? { plan: sub.plan, expiresAt: sub.expires_at, active: sub.active === 1 }
      : null,
  });
}
