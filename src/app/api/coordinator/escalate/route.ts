export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { realtimeBus } from "@/lib/realtime/eventBus";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, escalationTarget, reason, riskLevel } = body;

    const request = await prisma.humanSupportRequest.findUnique({
      where: { id: requestId },
      include: { chat: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
    }

    // Create safety event
    await prisma.safetyEvent.create({
      data: {
        userId: request.userId,
        conversationId: request.chat?.id || request.id,
        source: "HUMAN_CHAT",
        category: "OTHER",
        riskLevel: riskLevel || "HIGH",
        status: "ESCALATED",
        actionTaken: `Эскалировано на: ${escalationTarget}. Причина: ${reason}`,
      },
    });

    // Update request priority
    await prisma.humanSupportRequest.update({
      where: { id: requestId },
      data: {
        priority: "CRITICAL",
        safetyLevel: riskLevel || "HIGH",
        updatedAt: new Date(),
      },
    });

    // Add internal note
    await prisma.internalNote.create({
      data: {
        requestId: request.id,
        authorId: user.id,
        authorRole: user.role,
        content: `🚨 ЭСКАЛАЦИЯ на [${escalationTarget}]. Уровень риска: ${riskLevel}. Причина: ${reason}`,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "ESCALATE_SAFETY",
      targetType: "HumanSupportRequest",
      targetId: requestId,
      metadata: { escalationTarget, reason, riskLevel },
    });

    realtimeBus.emit("coordinator:queue", "queue_updated", { requestId, priority: "CRITICAL" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error escalating:", error);
    return NextResponse.json({ error: "Не удалось выполнить эскалацию" }, { status: 500 });
  }
}