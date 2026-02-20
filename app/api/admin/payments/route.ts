import { NextRequest, NextResponse } from "next/server";
import { getAllPayments, getUserById } from "@/lib/server/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function isAdmin(request: NextRequest): boolean {
  const auth = request.headers.get("X-Admin-Key");
  return auth === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = getAllPayments();

  const enriched = payments.map((p) => {
    const user = getUserById(p.user_id);
    return {
      id: p.id,
      userId: p.user_id,
      userEmail: user?.email || "unknown",
      plan: p.plan,
      amount: p.amount,
      label: p.label,
      status: p.status,
      yoomoneyOpid: p.yoomoney_opid,
      createdAt: p.created_at,
      confirmedAt: p.confirmed_at,
    };
  });

  return NextResponse.json({ success: true, payments: enriched });
}
