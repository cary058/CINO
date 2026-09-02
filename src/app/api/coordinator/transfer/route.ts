export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, reason, targetRole, targetUserId } = body;

    const request = await prisma.humanSupportRequest.findUnique({
      where: { id: requestId },
      include: { chat: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
    }

    // Decrement load of previous volunteer if applicable
    if (request.assignedHumanId && request.assignedHumanRole === "VOLUNTEER") {
      const prevVol = await prisma.volunteerProfile.findUnique({ where: { userId: request.assignedHumanId } });
      if (prevVol && prevVol.activeConversationsCount > 0) {
        await prisma.volunteerProfile.update({
          where: { id: prevVol.id },
          data: { activeConversationsCount: { decrement: 1 } },
        });
      }
    }

    // Update request state to TRANSFERRED or QUEUED for coordinator
    await prisma.humanSupportRequest.update({
      where: { id: requestId },
      data: {
        status: targetUserId ? "ACTIVE" : "QUEUED",
        assignedHumanId: targetUserId || null,
        assignedHumanRole: targetRole || null,
        updatedAt: new Date(),
      },
    });

    if (request.chat) {
      await prisma.humanChat.update({
        where: { id: request.chat.id },
        data: {
          helperId: targetUserId || null,
          helperRole: targetRole || "COORDINATOR",
        },
      });

      // System message
      await prisma.humanMessage.create({
        data: {
          chatId: request.chat.id,
          senderId: user.id,
          senderRole: "SYSTEM",
          content: `Обращение передано. Причина: ${reason || "Перераспределение обращения"}.`,
        },
      });
    }

    // Internal Note
    await prisma.internalNote.create({
      data: {
        requestId: request.id,
        authorId: user.id,
        authorRole: user.role,
        content: `Передача обращения. Причина: ${reason}. Прежний специалист: ${user.displayName}.`,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "TRANSFER_REQUEST",
      targetType: "HumanSupportRequest",
      targetId: requestId,
      metadata: { reason, targetRole, targetUserId },
    });

    realtimeBus.emit(`user:${request.userId}`, "request_transferred", { requestId });
    realtimeBus.emit("coordinator:queue", "queue_updated", { requestId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error transferring request:", error);
    return NextResponse.json({ error: "Не удалось передать обращение" }, { status: 500 });
  }
}