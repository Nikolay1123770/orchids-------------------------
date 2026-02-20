import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/auth";
import { getUserById, getActiveSubscription } from "@/lib/server/db";
import { updateClientExpiry, VPN_CONFIG } from "@/lib/server/xui";

function buildXrayConfig(uuid: string) {
  return {
    outbounds: [
      {
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: VPN_CONFIG.address,
              port: VPN_CONFIG.port,
              users: [{ id: uuid, encryption: "none", flow: "" }],
            },
          ],
        },
        streamSettings: {
          network: "ws",
          security: "none",
          wsSettings: { path: VPN_CONFIG.path, headers: {} },
        },
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    const sub = getActiveSubscription(userId);
    if (!sub) {
      return NextResponse.json(
        { success: false, message: "Нет активной подписки", needSubscription: true },
        { status: 403 }
      );
    }

    try {
      await updateClientExpiry(user.xui_email, user.uuid, sub.expires_at * 1000);
    } catch {
      // xui might be unreachable
    }

    const vlessUrl = `vless://${user.uuid}@${VPN_CONFIG.address}:${VPN_CONFIG.port}?type=${VPN_CONFIG.network}&path=${encodeURIComponent(VPN_CONFIG.path)}&encryption=none&security=none#SMG-VPN-Frankfurt`;

    return NextResponse.json({
      success: true,
      message: "Connected",
      config: {
        ...VPN_CONFIG,
        uuid: user.uuid,
        email: user.xui_email,
        vlessUrl,
        xrayConfig: buildXrayConfig(user.uuid),
      },
      subscription: { plan: sub.plan, expiresAt: sub.expires_at },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
