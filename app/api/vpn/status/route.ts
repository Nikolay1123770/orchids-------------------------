import { NextResponse } from "next/server";
import { getInbounds, INBOUND_ID } from "@/lib/server/xui";

export async function GET() {
  try {
    const start = Date.now();
    const data = await getInbounds();
    const ping = Date.now() - start;
    const inbound = data?.obj?.find((i: any) => i.id === INBOUND_ID);
    return NextResponse.json({
      success: true,
      online: true,
      ping,
      inbound: inbound ? { id: inbound.id, protocol: inbound.protocol, port: inbound.port } : null,
    });
  } catch {
    return NextResponse.json({ success: false, online: false, message: "Server unreachable" }, { status: 500 });
  }
}
