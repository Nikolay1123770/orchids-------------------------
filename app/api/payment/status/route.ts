import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import {
  getPaymentByLabel,
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
    if (data.operations && data.operations.length > 0) {
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

async function activateSubscription(
  payment: { user_id: number; plan: string },
  operationId: string,
  label: string
) {
  confirmPayment(label, operationId);
  const duration = PLAN_DURATION[payment.plan] || 30 * 24 * 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + duration;
  createSubscription(payment.user_id, payment.plan, expiresAt);

  const user = getUserById(payment.user_id);
  if (user) {
    try {
      await updateClientExpiry(user.xui_email, user.uuid, expiresAt * 1000);
    } catch {
      // xui might be unreachable
    }
  }
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const label = request.nextUrl.searchParams.get("label") || "";
  const payment = getPaymentByLabel(label);
  if (!payment || payment.user_id !== userId) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  // If still pending, try YooMoney API
  if (payment.status === "pending") {
    try {
      const found = await checkYooMoneyPayment(label, payment.amount);
      if (found) {
        await activateSubscription(payment, found.operation_id, label);
        return NextResponse.json({
          success: true,
          status: "confirmed",
          confirmedAt: Math.floor(Date.now() / 1000),
        });
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    success: true,
    status: payment.status,
    confirmedAt: payment.confirmed_at,
  });
}
