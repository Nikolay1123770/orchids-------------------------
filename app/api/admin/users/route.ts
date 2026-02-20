import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  getActiveSubscription,
  getSubscriptionsForUser,
  deactivateSubscription,
  grantSubscription,
  deleteUser,
} from "@/lib/server/db";
import { updateClientExpiry } from "@/lib/server/xui";
import { PLAN_DURATION } from "@/lib/server/constants";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function isAdmin(request: NextRequest): boolean {
  const auth = request.headers.get("X-Admin-Key");
  return auth === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = getAllUsers();
  const now = Math.floor(Date.now() / 1000);

  const usersWithSubs = users.map((u) => {
    const sub = getActiveSubscription(u.id);
    const allSubs = getSubscriptionsForUser(u.id);
    return {
      id: u.id,
      email: u.email,
      uuid: u.uuid,
      xuiEmail: u.xui_email,
      createdAt: u.created_at,
      subscription: sub
        ? {
            plan: sub.plan,
            expiresAt: sub.expires_at,
            active: sub.active === 1 && sub.expires_at > now,
            isTrial: sub.plan === "trial",
          }
        : null,
      totalSubscriptions: allSubs.length,
    };
  });

  return NextResponse.json({ success: true, users: usersWithSubs });
}

// Admin actions: grant subscription, deactivate, delete user
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { action, userId, plan } = await request.json();

    if (action === "grant") {
      const duration = PLAN_DURATION[plan];
      if (!duration) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      const expiresAt = grantSubscription(userId, plan, duration);

      // Try to update xui
      const users = getAllUsers();
      const user = users.find((u) => u.id === userId);
      if (user) {
        try {
          await updateClientExpiry(user.xui_email, user.uuid, expiresAt * 1000);
        } catch { /* ignore */ }
      }

      return NextResponse.json({ success: true, expiresAt });
    }

    if (action === "deactivate") {
      deactivateSubscription(userId);
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      deleteUser(userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
