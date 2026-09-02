export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:professionals")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const professionals = await prisma.professionalProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            anonymousId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ professionals });
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:professionals")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { professionalId, verificationStatus, maxActiveConversations } = body; // VERIFIED, REJECTED, SUSPENDED, PENDING

    const pro = await prisma.professionalProfile.findUnique({ where: { id: professionalId } });
    if (!pro) {
      return NextResponse.json({ error: "Специалист не найден" }, { status: 404 });
    }

    const updated = await prisma.professionalProfile.update({
      where: { id: professionalId },
      data: {
        ...(verificationStatus !== undefined && {
          verificationStatus,
          verifiedBy: verificationStatus === "VERIFIED" ? user.id : pro.verifiedBy,
          verifiedAt: verificationStatus === "VERIFIED" ? new Date() : pro.verifiedAt,
          availability: verificationStatus === "VERIFIED" ? "AVAILABLE" : "OFFLINE",
        }),
        ...(maxActiveConversations !== undefined && { maxActiveConversations }),
      },
    });

    if (verificationStatus === "VERIFIED") {
      await prisma.notification.create({
        data: {
          userId: pro.userId,
          title: "Квалификация верифицирована",
          message: "Ваша квалификация психолога успешно подтверждена. Вам открыт доступ к профильным обращениям.",
          type: "SYSTEM",
          link: "/psychologist",
        },
      });
    }

    await logAuditEvent({
      actorUserId: user.id,
      action: `PROFESSIONAL_VERIFICATION_${verificationStatus || "UPDATED"}`,
      targetType: "ProfessionalProfile",
      targetId: professionalId,
      metadata: { verificationStatus },
    });

    return NextResponse.json({ success: true, professional: updated });
  } catch (error) {
    console.error("Error updating professional:", error);
    return NextResponse.json({ error: "Не удалось обновить статус специалиста" }, { status: 500 });
  }
}