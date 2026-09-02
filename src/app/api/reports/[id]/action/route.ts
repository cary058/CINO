export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "moderator:actions")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json({ error: "Жалоба не найдена" }, { status: 404 });
    }

    const body = await req.json();
    const { actionType, reason, resolution } = body; // WARNING, TEMPORARY_RESTRICTION, SUSPENSION, DISMISS

    // Record moderation action
    const modAction = await prisma.moderationAction.create({
      data: {
        reportId: report.id,
        moderatorId: user.id,
        targetUserId: report.reportedUserId || "system",
        actionType,
        reason: reason || resolution || "Модерация по жалобе",
      },
    });

    // If suspension, suspend target user
    if (actionType === "SUSPENSION" && report.reportedUserId) {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { status: "SUSPENDED" },
      });
      await prisma.session.deleteMany({ where: { userId: report.reportedUserId } });
    }

    // Close / resolve report
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: actionType === "DISMISS" ? "DISMISSED" : "RESOLVED",
        assignedModeratorId: user.id,
        resolution: resolution || actionType,
        resolvedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: `MODERATION_${actionType}`,
      targetType: "Report",
      targetId: report.id,
      metadata: { targetUserId: report.reportedUserId, actionType, reason },
    });

    return NextResponse.json({ success: true, action: modAction });
  } catch (error) {
    console.error("Error executing moderation action:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}