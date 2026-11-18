export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAnonymousId, createSessionToken, setSessionCookie, isStaffAccessAllowed } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { logAuditEvent } from "@/lib/audit";
import { isStaff } from "@/lib/rbac";

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
    const { email, password, displayName, consents, inviteToken } = body;

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

    const normalizedEmail = String(email).toLowerCase().trim();
    let invitation: { id: string; role: string; email: string; usedAt: Date | null; expiresAt: Date } | null = null;
    if (inviteToken) {
      invitation = await prisma.invitation.findUnique({
        where: { token: String(inviteToken) },
        select: { id: true, role: true, email: true, usedAt: true, expiresAt: true },
      });
      if (!invitation || invitation.email.toLowerCase() !== normalizedEmail || invitation.usedAt || invitation.expiresAt <= new Date()) {
        return NextResponse.json({ error: "Приглашение недействительно, уже использовано или истекло." }, { status: 403 });
      }
      if (!isStaff(invitation.role as any)) {
        return NextResponse.json({ error: "Это приглашение не назначает служебную роль." }, { status: 400 });
      }
      if (process.env.NODE_ENV === "production" && !isStaffAccessAllowed(normalizedEmail)) {
        return NextResponse.json({ error: "Администратор ещё не открыл этому адресу служебный доступ." }, { status: 403 });
      }
      if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "true" && invitation.role !== "PROFESSIONAL") {
        return NextResponse.json({ error: "В демо-версии сейчас можно принять приглашение только психологу." }, { status: 403 });
      }
    } else if (process.env.NODE_ENV === "production" && isStaffAccessAllowed(normalizedEmail)) {
      return NextResponse.json({ error: "Для этого адреса требуется одноразовое приглашение администратора." }, { status: 403 });
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

    const role = invitation?.role || "USER";
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role,
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
        include: { profile: true },
      });

      if (invitation?.role === "PROFESSIONAL") {
        await tx.professionalProfile.create({
          data: {
            userId: created.id,
            displayName: displayName?.trim() || "Психолог",
            education: "Ожидает заполнения",
            qualification: "Ожидает проверки администратором",
            verificationStatus: "PENDING",
            availability: "OFFLINE",
          },
        });
      }

      if (Array.isArray(consents) && consents.length > 0) {
        await tx.userConsent.createMany({
          data: consents.map((consent: string) => ({
            userId: created.id,
            consentType: consent,
            documentVersion: "1.0",
          })),
        });
      }

      await tx.aIChat.create({
        data: { userId: created.id, title: "Первый разговор", mode: "LISTENING" },
      });

      if (invitation) {
        const used = await tx.invitation.updateMany({
          where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        });
        if (used.count !== 1) throw new Error("INVITATION_ALREADY_USED");
      }

      return created;
    });

    const token = await createSessionToken(user.id);
    setSessionCookie(token);

    await logAuditEvent({
      actorUserId: user.id,
      action: invitation ? `REGISTER_INVITED_${role}` : "REGISTER",
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

