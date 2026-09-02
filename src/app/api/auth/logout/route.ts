export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, deleteSessionCookie } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAuditEvent({
        actorUserId: user.id,
        action: "LOGOUT",
        targetType: "User",
        targetId: user.id,
      });
    }
    deleteSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}