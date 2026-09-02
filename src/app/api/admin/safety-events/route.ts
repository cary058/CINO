export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get("riskLevel");
    const status = searchParams.get("status");

    const events = await prisma.safetyEvent.findMany({
      where: {
        ...(riskLevel && { riskLevel }),
        ...(status && { status }),
      },
      include: {
        user: { select: { anonymousId: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching safety events:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, status, actionTaken } = body; // OPEN, ACKNOWLEDGED, ESCALATED, RESOLVED

    const updated = await prisma.safetyEvent.update({
      where: { id: eventId },
      data: {
        status,
        actionTaken,
        handledBy: user.id,
        handledAt: new Date(),
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "UPDATE_SAFETY_EVENT",
      targetType: "SafetyEvent",
      targetId: eventId,
      metadata: { status, actionTaken },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error("Error updating safety event:", error);
    return NextResponse.json({ error: "Не удалось обновить событие безопасности" }, { status: 500 });
  }
}