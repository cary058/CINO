export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "moderator:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, anonymousId: true, role: true },
        },
        reportedUser: {
          select: { id: true, anonymousId: true, role: true, status: true },
        },
        actions: true,
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { reportedUserId, conversationId, reason, description } = body;

    if (!reason || !description) {
      return NextResponse.json(
        { error: "Пожалуйста, укажите причину и описание жалобы." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: reportedUserId || null,
        conversationId: conversationId || null,
        reason,
        description: description.trim(),
        status: "OPEN",
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "SUBMIT_REPORT",
      targetType: "Report",
      targetId: report.id,
      metadata: { reason, reportedUserId },
    });

    return NextResponse.json({
      success: true,
      report,
      message: "Жалоба принята. Модераторы рассмотрят её в ближайшее время.",
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json({ error: "Не удалось отправить жалобу" }, { status: 500 });
  }
}