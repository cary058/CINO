export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, closeReason } = body;

    const request = await prisma.humanSupportRequest.findUnique({
      where: { id: requestId },
      include: { chat: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
    }

    const isCoordinator = hasPermission(user.role, "coordinator:dashboard");
    const isAssignedHelper = request.assignedHumanId === user.id &&
      ((request.assignedHumanRole === "VOLUNTEER" && hasPermission(user.role, "volunteer:dashboard")) ||
       (request.assignedHumanRole === "PROFESSIONAL" && hasPermission(user.role, "professional:dashboard")));
    if (!isCoordinator && !isAssignedHelper) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Decrement active load if assigned to volunteer
    if (request.assignedHumanId && request.assignedHumanRole === "VOLUNTEER") {
      const vol = await prisma.volunteerProfile.findUnique({ where: { userId: request.assignedHumanId } });
      if (vol && vol.activeConversationsCount > 0) {
        await prisma.volunteerProfile.update({
          where: { id: vol.id },
          data: { activeConversationsCount: { decrement: 1 } },
        });
      }
    }

    // Close request and chat
    await prisma.humanSupportRequest.update({
      where: { id: requestId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    if (request.chat) {
      await prisma.humanChat.update({
        where: { id: request.chat.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      await prisma.humanMessage.create({
        data: {
          chatId: request.chat.id,
          senderId: user.id,
          senderRole: "SYSTEM",
          content: "Диалог поддержки завершен. Спасибо за обращение в СИНО.",
        },
      });
    }

    await logAuditEvent({
      actorUserId: user.id,
      action: "CLOSE_HUMAN_REQUEST",
      targetType: "HumanSupportRequest",
      targetId: requestId,
      metadata: { closeReason },
    });

    realtimeBus.emit(`user:${request.userId}`, "chat_closed", { requestId });
    realtimeBus.emit("coordinator:queue", "queue_updated", { requestId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error closing request:", error);
    return NextResponse.json({ error: "Не удалось закрыть диалог" }, { status: 500 });
  }
}

