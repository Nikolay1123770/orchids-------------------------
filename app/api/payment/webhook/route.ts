import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getPaymentByLabel,
  getUserById,
  confirmPayment,
  createSubscription,
} from "@/lib/server/db";
import { updateClientExpiry } from "@/lib/server/xui";
import { YOOMONEY_TOKEN, PRICES, PLAN_DURATION } from "@/lib/server/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const notification_type = params.get("notification_type") || "";
    const operation_id = params.get("operation_id") || "";
    const amount = params.get("amount") || "";
    const currency = params.get("currency") || "";
    const datetime = params.get("datetime") || "";
    const sender = params.get("sender") || "";
    const codepro = params.get("codepro") || "";
    const label = params.get("label") || "";
    const sha1_hash = params.get("sha1_hash") || "";

    // Verify SHA1 signature
    const str = [notification_type, operation_id, amount, currency, datetime, sender, codepro, YOOMONEY_TOKEN, label].join("&");
    const expected = crypto.createHash("sha1").update(str).digest("hex");

    if (expected !== sha1_hash) {
      return new NextResponse("bad signature", { status: 400 });
    }

    const payment = getPaymentByLabel(label);
    if (!payment || payment.status === "confirmed") {
      return new NextResponse("ok");
    }

    if (parseFloat(amount) < PRICES[payment.plan]) {
      return new NextResponse("wrong amount", { status: 400 });
    }

    confirmPayment(label, operation_id);
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

    return new NextResponse("ok");
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
