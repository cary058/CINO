export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, education, university, course, experience, motivation, languages } = body;

    if (!fullName || !education || !motivation) {
      return NextResponse.json(
        { error: "Пожалуйста, заполните обязательные поля: ФИО, образование и мотивацию." },
        { status: 400 }
      );
    }

    // Upsert volunteer profile
    const profile = await prisma.volunteerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName,
        education,
        university,
        course,
        experience,
        motivation,
        languages: languages || "ru",
        status: "TRAINING", // moved to training state
      },
      create: {
        userId: user.id,
        fullName,
        education,
        university,
        course,
        experience,
        motivation,
        languages: languages || "ru",
        status: "TRAINING",
        availability: "OFFLINE",
      },
    });

    // Initialize progress record
    await prisma.volunteerProgress.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        completedModules: 0,
        totalModules: 10,
        trainingCompleted: false,
      },
    });

    // Update user role to VOLUNTEER (in training)
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "VOLUNTEER" },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "VOLUNTEER_APPLICATION_SUBMITTED",
      targetType: "VolunteerProfile",
      targetId: profile.id,
    });

    return NextResponse.json({
      success: true,
      profile,
      message: "Заявка принята! Перейдите к обязательному обучающему курсу.",
    });
  } catch (error) {
    console.error("Error submitting volunteer application:", error);
    return NextResponse.json({ error: "Не удалось отправить заявку" }, { status: 500 });
  }
}