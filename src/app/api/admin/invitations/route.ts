export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";
import { isStaff } from "@/lib/rbac";
import { isStaffAccessAllowed } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Укажите email и роль" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isStaff(String(role) as any)) {
      return NextResponse.json({ error: "Выберите служебную роль." }, { status: 400 });
    }
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "true" && role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "В демо-версии можно приглашать только психологов." }, { status: 403 });
    }
    if (process.env.NODE_ENV === "production" && !isStaffAccessAllowed(normalizedEmail)) {
      return NextResponse.json({ error: "Сначала администратор должен разрешить этому адресу служебный доступ." }, { status: 403 });
    }
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ error: "Для этого адреса уже создан аккаунт." }, { status: 409 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email: normalizedEmail,
        role,
        token,
        createdBy: user.id,
        expiresAt,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "CREATE_INVITATION",
      targetType: "Invitation",
      targetId: invitation.id,
      metadata: { email: normalizedEmail, role },
    });

    const inviteLink = `${process.env.APP_URL || "http://localhost:3000"}/register?invite=${token}`;

    return NextResponse.json({
      success: true,
      invitation,
      inviteLink,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Не удалось создать приглашение" }, { status: 500 });
  }
}

