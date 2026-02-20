import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createUser, getUserByEmail } from "@/lib/server/db";
import { signToken } from "@/lib/server/auth";
import { addClient } from "@/lib/server/xui";

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

    // Create xray client in 3x-ui (no expiry until subscription)
    try {
      await addClient(xuiEmail, uuid, 0, false);
    } catch {
      // might fail if 3x-ui is unreachable, ignore
    }

    const token = signToken(user.id);
    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, uuid: user.uuid },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
