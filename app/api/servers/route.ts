import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    servers: [
      {
        id: "1",
        name: "Frankfurt #1",
        country: "Germany",
        city: "\u0424\u0440\u0430\u043D\u043A\u0444\u0443\u0440\u0442",
        flag: "\uD83C\uDDE9\uD83C\uDDEA",
        protocol: "VLESS",
        transport: "WebSocket",
        recommended: true,
      },
    ],
  });
}
