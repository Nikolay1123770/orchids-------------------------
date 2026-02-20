import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  getAllSubscriptions,
  getAllPayments,
} from "@/lib/server/db";

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
  const subscriptions = getAllSubscriptions();
  const payments = getAllPayments();

  const now = Math.floor(Date.now() / 1000);
  const activeSubscriptions = subscriptions.filter(
    (s) => s.active === 1 && s.expires_at > now
  );
  const trialSubs = activeSubscriptions.filter((s) => s.plan === "trial");
  const paidSubs = activeSubscriptions.filter((s) => s.plan !== "trial");
  const confirmedPayments = payments.filter((s) => s.status === "confirmed");
  const totalRevenue = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: users.length,
      activeSubscriptions: activeSubscriptions.length,
      trialSubscriptions: trialSubs.length,
      paidSubscriptions: paidSubs.length,
      totalPayments: payments.length,
      confirmedPayments: confirmedPayments.length,
      totalRevenue,
    },
  });
}
