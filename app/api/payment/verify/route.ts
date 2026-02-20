import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import {
  getPendingPaymentsForUser,
  getActiveSubscription,
  getUserById,
  confirmPayment,
  createSubscription,
} from "@/lib/server/db";
import { updateClientExpiry } from "@/lib/server/xui";
import { YOOMONEY_TOKEN, PLAN_DURATION } from "@/lib/server/constants";

async function checkYooMoneyPayment(
  label: string,
  expectedAmount: number
): Promise<{ operation_id: string } | null> {
  try {
    const res = await fetch("https://yoomoney.ru/api/operation-history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOOMONEY_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "deposition",
        label,
        records: "1",
      }).toString(),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (data.operations?.length > 0) {
      const op = data.operations[0];
      if (op.status === "success" && Math.abs(op.amount) >= expectedAmount) {
        return { operation_id: op.operation_id };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const pendingPayments = getPendingPaymentsForUser(userId);
  let activated = false;

  for (const payment of pendingPayments) {
    const found = await checkYooMoneyPayment(payment.label, payment.amount);
    if (found) {
      confirmPayment(payment.label, found.operation_id);
      const duration = PLAN_DURATION[payment.plan] || 30 * 24 * 3600;
      const expiresAt = Math.floor(Date.now() / 1000) + duration;
      createSubscription(payment.user_id, payment.plan, expiresAt);

      const user = getUserById(payment.user_id);
      if (user) {
        try {
          await updateClientExpiry(user.xui_email, user.uuid, expiresAt * 1000);
        } catch {
          // ignore
        }
      }
      activated = true;
      break;
    }
  }

  if (activated) {
    const sub = getActiveSubscription(userId);
    return NextResponse.json({
      success: true,
      activated: true,
      subscription: sub
        ? { plan: sub.plan, expiresAt: sub.expires_at, active: sub.active === 1 }
        : null,
    });
  }

  return NextResponse.json({
    success: true,
    activated: false,
    message: "Оплата ещё не найдена. Попробуйте позже.",
  });
}
