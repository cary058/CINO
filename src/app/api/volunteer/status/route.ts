export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const vol = await prisma.volunteerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          include: { volunteerProgress: true },
        },
      },
    });

    return NextResponse.json({ volunteer: vol });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const vol = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!vol) {
      return NextResponse.json({ error: "Профиль волонтёра не найден" }, { status: 404 });
    }

    if (vol.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Вы не можете изменить статус доступности до одобрения заявки администратором." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { availability } = body; // AVAILABLE, BUSY, OFFLINE, PAUSED

    const updated = await prisma.volunteerProfile.update({
      where: { id: vol.id },
      data: { availability },
    });

    return NextResponse.json({ success: true, volunteer: updated });
  } catch (error) {
    console.error("Error updating volunteer availability:", error);
    return NextResponse.json({ error: "Не удалось обновить статус" }, { status: 500 });
  }
}