import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export const JWT_SECRET = process.env.JWT_SECRET || "smgvpn_secret_2025_$#@!";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}
