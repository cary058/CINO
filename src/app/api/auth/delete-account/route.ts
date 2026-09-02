export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, deleteSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Soft delete user and clear active sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        email: `deleted_${user.id.substring(0, 8)}@sino.deleted`,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "DELETE_ACCOUNT",
      targetType: "User",
      targetId: user.id,
    });

    deleteSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Не удалось удалить аккаунт" }, { status: 500 });
  }
}