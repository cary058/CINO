export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAnonymousId, createSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limit = checkRateLimit(`register:${ip}`, 10, 60000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток регистрации. Пожалуйста, подождите минуту." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, displayName, consents } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Пожалуйста, укажите email и пароль." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 8 символов." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const anonymousId = generateAnonymousId();

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        anonymousId,
        profile: {
          create: {
            displayName: displayName?.trim() || "Пользователь",
            themePreference: "NIGHT",
            language: "ru",
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Save consents if provided during onboarding
    if (Array.isArray(consents) && consents.length > 0) {
      await prisma.userConsent.createMany({
        data: consents.map((c: string) => ({
          userId: user.id,
          consentType: c,
          documentVersion: "1.0",
        })),
      });
    }

    // Auto-create first AI Chat
    await prisma.aIChat.create({
      data: {
        userId: user.id,
        title: "Первый разговор",
        mode: "LISTENING",
      },
    });

    const token = await createSessionToken(user.id);
    setSessionCookie(token);

    await logAuditEvent({
      actorUserId: user.id,
      action: "REGISTER",
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже." },
      { status: 500 }
    );
  }
}

