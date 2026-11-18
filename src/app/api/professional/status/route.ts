export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

const availabilityStatuses = new Set(["AVAILABLE", "BUSY", "OFFLINE", "PAUSED"]);

async function getProfessionalProfile(userId: string, role: string) {
  let profile = await prisma.professionalProfile.findUnique({ where: { userId } });

  // The shared SUPER_ADMIN account is also used to demonstrate the psychologist
  // workflow. Keep that clearly marked as demo data instead of pretending a
  // real professional was verified.
  if (!profile && role === "SUPER_ADMIN" && process.env.DEMO_MODE === "true") {
    profile = await prisma.professionalProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        displayName: "Демо-психолог СИНО",
        education: "Демо-профиль",
        qualification: "Тестовая роль, не реальная квалификация",
        verificationStatus: "DEMO_VERIFIED",
        availability: "OFFLINE",
      },
    });
  }

  return profile;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "professional:dashboard")) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const pro = await getProfessionalProfile(user.id, user.role);

    return NextResponse.json({ professional: pro });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "professional:dashboard")) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const pro = await getProfessionalProfile(user.id, user.role);
    if (!pro) {
      return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    }

    const isVerified = pro.verificationStatus === "VERIFIED";
    const isDemoVerified = pro.verificationStatus === "DEMO_VERIFIED" && process.env.DEMO_MODE === "true";
    const isPendingReview = pro.verificationStatus === "PENDING";
    if (!isVerified && !isDemoVerified && !isPendingReview) {
      return NextResponse.json(
        { error: "Вы не можете изменить статус доступности до верификации квалификации администратором." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { availability } = body;

    if (typeof availability !== "string" || !availabilityStatuses.has(availability)) {
      return NextResponse.json({ error: "Выберите доступный статус." }, { status: 400 });
    }

    const updated = await prisma.professionalProfile.update({
      where: { id: pro.id },
      data: { availability },
    });

    return NextResponse.json({ success: true, professional: updated });
  } catch (error) {
    console.error("Error updating pro status:", error);
    return NextResponse.json({ error: "Не удалось обновить статус" }, { status: 500 });
  }
}

