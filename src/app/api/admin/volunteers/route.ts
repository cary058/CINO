export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:volunteers")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const volunteers = await prisma.volunteerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            anonymousId: true,
            status: true,
            volunteerProgress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:volunteers")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { volunteerId, status, maxActiveConversations } = body; // APPROVED, REJECTED, SUSPENDED, PENDING

    const vol = await prisma.volunteerProfile.findUnique({ where: { id: volunteerId } });
    if (!vol) {
      return NextResponse.json({ error: "Волонтёр не найден" }, { status: 404 });
    }

    const updated = await prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: {
        ...(status !== undefined && {
          status,
          approvedBy: status === "APPROVED" ? user.id : vol.approvedBy,
          approvedAt: status === "APPROVED" ? new Date() : vol.approvedAt,
          availability: status === "APPROVED" ? "AVAILABLE" : "OFFLINE",
        }),
        ...(maxActiveConversations !== undefined && { maxActiveConversations }),
      },
    });

    if (status === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: vol.userId,
          title: "Заявка волонтёра одобрена",
          message: "Поздравляем! Ваша заявка волонтёра одобрена. Вы можете принимать обращения.",
          type: "TRAINING_UPDATE",
          link: "/volunteer/dashboard",
        },
      });
    }

    await logAuditEvent({
      actorUserId: user.id,
      action: `VOLUNTEER_STATUS_${status || "UPDATED"}`,
      targetType: "VolunteerProfile",
      targetId: volunteerId,
      metadata: { status, maxActiveConversations },
    });

    return NextResponse.json({ success: true, volunteer: updated });
  } catch (error) {
    console.error("Error updating volunteer:", error);
    return NextResponse.json({ error: "Не удалось обновить статус волонтёра" }, { status: 500 });
  }
}