export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:settings")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:settings")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: String(value),
        updatedBy: user.id,
      },
      create: {
        key,
        value: String(value),
        updatedBy: user.id,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "UPDATE_SYSTEM_SETTING",
      targetType: "SystemSetting",
      targetId: key,
      metadata: { key, value },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Не удалось обновить настройку" }, { status: 500 });
  }
}