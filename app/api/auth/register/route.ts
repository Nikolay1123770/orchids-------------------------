import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createUser, getUserByEmail, createSubscription, getActiveSubscription } from "@/lib/server/db";
import { signToken } from "@/lib/server/auth";
import { addClient, updateClientExpiry } from "@/lib/server/xui";
import { TRIAL_DURATION } from "@/lib/server/constants";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email и пароль обязательны" }, { status: 400 });
    }

    if (getUserByEmail(email)) {
      return NextResponse.json({ success: false, message: "Email уже зарегистрирован" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const uuid = uuidv4();
    const xuiEmail = "smg_" + uuidv4().replace(/-/g, "").slice(0, 12);

    const user = createUser(email, hashed, uuid, xuiEmail);

    // Create 2-day trial subscription automatically
    const trialExpiresAt = Math.floor(Date.now() / 1000) + TRIAL_DURATION;
    createSubscription(user.id, "trial", trialExpiresAt);

    // Create xray client in 3x-ui with trial expiry
    try {
      await addClient(xuiEmail, uuid, trialExpiresAt * 1000, true);
    } catch {
      // might fail if 3x-ui is unreachable, ignore
    }

    // Also update expiry
    try {
      await updateClientExpiry(xuiEmail, uuid, trialExpiresAt * 1000);
    } catch {
      // ignore
    }

    const token = signToken(user.id);
    const sub = getActiveSubscription(user.id);

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, uuid: user.uuid },
      subscription: sub
        ? { plan: sub.plan, expiresAt: sub.expires_at, active: sub.active === 1 }
        : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
