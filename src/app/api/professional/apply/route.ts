export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "true") {
      return NextResponse.json({ error: "Приём заявок временно закрыт. Роли назначает администратор." }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, education, qualification, specializations, registrationIdentifier } = body;

    if (!displayName || !education || !qualification) {
      return NextResponse.json(
        { error: "Пожалуйста, заполните имя, образование и квалификацию." },
        { status: 400 }
      );
    }

    const profile = await prisma.professionalProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName,
        education,
        qualification,
        specializations,
        registrationIdentifier,
        verificationStatus: "PENDING",
      },
      create: {
        userId: user.id,
        displayName,
        education,
        qualification,
        specializations,
        registrationIdentifier,
        verificationStatus: "PENDING",
        availability: "OFFLINE",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "PROFESSIONAL" },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "PROFESSIONAL_APPLICATION_SUBMITTED",
      targetType: "ProfessionalProfile",
      targetId: profile.id,
    });

    return NextResponse.json({
      success: true,
      profile,
      message: "Заявка отправлена на верификацию документов администратором платформы.",
    });
  } catch (error) {
    console.error("Error applying as professional:", error);
    return NextResponse.json({ error: "Не удалось отправить заявку" }, { status: 500 });
  }
}

