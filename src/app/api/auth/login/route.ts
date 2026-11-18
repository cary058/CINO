export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie, isStaffAccessAllowed } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limit = checkRateLimit(`login:${ip}`, 15, 60000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток входа. Пожалуйста, подождите минуту." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Пожалуйста, введите email и пароль." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        profile: true,
        consents: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Ваш аккаунт временно заблокирован модератором." },
        { status: 403 }
      );
    }

    if (user.status === "DELETED") {
      return NextResponse.json(
        { error: "Аккаунт был удален." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 }
      );
    }

    if (isStaff(user.role as any) && !isStaffAccessAllowed(user.email)) {
      return NextResponse.json({ error: "Доступ к служебному кабинету пока не назначен." }, { status: 403 });
    }

    const token = await createSessionToken(user.id);
    setSessionCookie(token);

    await logAuditEvent({
      actorUserId: user.id,
      action: "LOGIN",
      targetType: "User",
      targetId: user.id,
      ipAddress: process.env.DEMO_MODE === "true" ? undefined : ip,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        anonymousId: user.anonymousId,
        displayName: user.profile?.displayName,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Произошла ошибка при входе. Попробуйте снова." },
      { status: 500 }
    );
  }
}

