export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "coordinator:assign")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, helperUserId, helperRole } = body; // helperRole: "VOLUNTEER" | "PROFESSIONAL"

    if (!requestId || !helperUserId || !helperRole) {
      return NextResponse.json({ error: "Не все параметры переданы" }, { status: 400 });
    }

    const request = await prisma.humanSupportRequest.findUnique({
      where: { id: requestId },
      include: { chat: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
    }

    if (!request.chat || request.status === "CLOSED") {
      return NextResponse.json({ error: "Обращение уже закрыто или у него нет чата." }, { status: 400 });
    }

    const helper = await prisma.user.findUnique({
      where: { id: helperUserId },
      include: {
        profile: true,
        volunteerProfile: true,
        professionalProfile: true,
      },
    });

    if (!helper || helper.status !== "ACTIVE") {
      return NextResponse.json({ error: "Выбранный специалист недоступен" }, { status: 400 });
    }

    if (helperRole === "VOLUNTEER" && (!helper.volunteerProfile || helper.volunteerProfile.status !== "APPROVED" || helper.volunteerProfile.availability !== "AVAILABLE")) {
      return NextResponse.json({ error: "Волонтёр не одобрен или сейчас недоступен." }, { status: 400 });
    }

    if (helperRole === "PROFESSIONAL" && (!helper.professionalProfile || helper.professionalProfile.verificationStatus !== "VERIFIED" || helper.professionalProfile.availability !== "AVAILABLE")) {
      return NextResponse.json({ error: "Психолог не прошёл проверку или сейчас недоступен." }, { status: 400 });
    }

    if (helperRole !== "VOLUNTEER" && helperRole !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Неизвестная роль специалиста." }, { status: 400 });
    }

    // Check capacity
    if (helperRole === "VOLUNTEER" && helper.volunteerProfile) {
      if (helper.volunteerProfile.activeConversationsCount >= helper.volunteerProfile.maxActiveConversations) {
        return NextResponse.json(
          { error: "У данного волонтёра уже достигнут лимит активных диалогов." },
          { status: 400 }
        );
      }
      // Increment active count
      await prisma.volunteerProfile.update({
        where: { id: helper.volunteerProfile.id },
        data: { activeConversationsCount: { increment: 1 } },
      });
    }

    // Update request
    const updatedRequest = await prisma.humanSupportRequest.update({
      where: { id: requestId },
      data: {
        status: "ACTIVE",
        assignedCoordinatorId: user.id,
        assignedHumanId: helper.id,
        assignedHumanRole: helperRole,
        updatedAt: new Date(),
      },
    });

    // Update chat helper
    if (request.chat) {
      await prisma.humanChat.update({
        where: { id: request.chat.id },
        data: {
          helperId: helper.id,
          helperRole: helperRole,
          status: "ACTIVE",
        },
      });

      // System notification message in chat
      await prisma.humanMessage.create({
        data: {
          chatId: request.chat.id,
          senderId: user.id,
          senderRole: "SYSTEM",
          content: `Обращение назначено специалисту (${helper.profile?.displayName || "Человек поддержки"}).`,
        },
      });
    }

    // Create Notification for Helper
    await prisma.notification.create({
      data: {
        userId: helper.id,
        title: "Новое обращение",
        message: `Вам назначено новое обращение поддержки.`,
        type: "HUMAN_ASSIGNED",
        link: helperRole === "VOLUNTEER" ? "/volunteer/dashboard" : "/psychologist",
      },
    });

    // Audit Log
    await logAuditEvent({
      actorUserId: user.id,
      action: "ASSIGN_HELPER",
      targetType: "HumanSupportRequest",
      targetId: requestId,
      metadata: { helperUserId, helperRole },
    });

    // Realtime notification
    realtimeBus.emit(`user:${request.userId}`, "helper_assigned", {
      requestId: request.id,
      helperRole,
    });
    realtimeBus.emit(`user:${helper.id}`, "new_assigned_chat", {
      requestId: request.id,
      chatId: request.chat?.id,
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Error assigning helper:", error);
    return NextResponse.json({ error: "Ошибка при назначении" }, { status: 500 });
  }
}

