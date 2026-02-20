import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, getActiveSubscription } from "@/lib/server/db";
import { signToken } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, message: "Неверный email или пароль" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Неверный email или пароль" }, { status: 401 });
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
