export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:users")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: {
        ...(search && {
          OR: [
            { email: { contains: search } },
            { anonymousId: { contains: search } },
          ],
        }),
        ...(role && { role }),
      },
      include: {
        profile: true,
        volunteerProfile: true,
        professionalProfile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:users")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, status, role } = body;

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Protection: ordinary admin cannot modify super admin
    if (targetUser.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Нельзя изменить владельца системы" }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status !== undefined && { status }),
        ...(role !== undefined && { role }),
      },
    });

    if (status === "SUSPENDED" || status === "DELETED") {
      await prisma.session.deleteMany({ where: { userId } });
    }

    await logAuditEvent({
      actorUserId: user.id,
      action: "ADMIN_UPDATE_USER",
      targetType: "User",
      targetId: userId,
      metadata: { status, role },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Не удалось обновить пользователя" }, { status: 500 });
  }
}