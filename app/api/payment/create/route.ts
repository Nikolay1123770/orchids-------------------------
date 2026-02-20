import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { createPayment } from "@/lib/server/db";
import { PRICES, YOOMONEY_WALLET } from "@/lib/server/constants";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!PRICES[plan]) {
      return NextResponse.json({ success: false, message: "Неверный тариф" }, { status: 400 });
    }

    const amount = PRICES[plan];
    const label = `smgvpn_${userId}_${plan}_${Date.now()}`;

    createPayment(userId, plan, amount, label);

    // Build the backend URL for successURL redirect
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const successURL = `${origin}/api/payment/success?label=${encodeURIComponent(label)}`;

    const params = new URLSearchParams({
      receiver: YOOMONEY_WALLET,
      "quickpay-form": "donate",
      paymentType: "AC",
      sum: String(amount),
      label: label,
      successURL: successURL,
      comment: `SMG VPN \u2014 ${plan.replace("_", " ")}`,
    });

    const payUrl = `https://yoomoney.ru/quickpay/confirm.xml?${params.toString()}`;

    return NextResponse.json({ success: true, payUrl, label, amount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
