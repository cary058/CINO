export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeMessageSafety } from "@/lib/ai/safetyLayer";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const activeRequest = await prisma.humanSupportRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] },
      },
      include: {
        chat: {
          include: {
            helper: {
              select: {
                id: true,
                role: true,
                anonymousId: true,
                profile: { select: { displayName: true } },
                volunteerProfile: { select: { status: true } },
                professionalProfile: { select: { displayName: true, qualification: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activeRequest });
  } catch (error) {
    console.error("Error fetching human request:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Check Kill Switch for human support
    const humanSetting = await prisma.systemSetting.findUnique({ where: { key: "ENABLE_HUMAN_SUPPORT" } });
    if (humanSetting && humanSetting.value === "false") {
      return NextResponse.json(
        { error: "Поддержка живыми людьми временно приостановлена." },
        { status: 503 }
      );
    }

    // Check if user already has an active request
    const existing = await prisma.humanSupportRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "У вас уже есть активное обращение к человеку поддержки.", request: existing },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason, category, needUrgent } = body;

    const userReason = reason?.trim() || "Пользователь запросил поддержку живого человека";
    const userCategory = category || "DONT_KNOW";

    // Analyze safety level
    const safety = analyzeMessageSafety(userReason);
    let priority = "MEDIUM";
    if (safety.riskLevel === "CRITICAL" || safety.riskLevel === "HIGH" || needUrgent) {
      priority = "HIGH";
    }

    const request = await prisma.humanSupportRequest.create({
      data: {
        userId: user.id,
        reason: userReason,
        category: userCategory,
        priority,
        safetyLevel: safety.riskLevel,
        status: "QUEUED",
      },
    });

    // Create an initial Chat instance with Coordinator
    const chat = await prisma.humanChat.create({
      data: {
        requestId: request.id,
        userId: user.id,
        helperRole: "COORDINATOR",
        status: "ACTIVE",
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "CREATE_HUMAN_REQUEST",
      targetType: "HumanSupportRequest",
      targetId: request.id,
    });

    // Notify coordinator queue
    realtimeBus.emit("coordinator:queue", "new_request", {
      requestId: request.id,
      anonymousId: user.anonymousId,
      category: request.category,
      priority: request.priority,
    });

    return NextResponse.json({
      success: true,
      request,
      chatId: chat.id,
    });
  } catch (error) {
    console.error("Error creating human request:", error);
    return NextResponse.json(
      { error: "Не удалось создать запрос. Попробуйте снова." },
      { status: 500 }
    );
  }
}