export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:kill_switch")) {
      return NextResponse.json({ error: "Доступ разрешен только главному администратору" }, { status: 403 });
    }

    const body = await req.json();
    const { target, enabled } = body; // target: "ENABLE_AI" | "ENABLE_HUMAN_SUPPORT"

    if (target !== "ENABLE_AI" && target !== "ENABLE_HUMAN_SUPPORT") {
      return NextResponse.json({ error: "Некорректный переключатель" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: target },
      update: {
        value: enabled ? "true" : "false",
        updatedBy: user.id,
      },
      create: {
        key: target,
        value: enabled ? "true" : "false",
        updatedBy: user.id,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: `KILL_SWITCH_${target}_${enabled ? "ENABLED" : "DISABLED"}`,
      targetType: "SystemSetting",
      targetId: target,
      metadata: { target, enabled },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("Error toggling kill switch:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}