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

    const pro = await prisma.professionalProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ professional: pro });
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

    const pro = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!pro) {
      return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    }

    if (pro.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { error: "Вы не можете изменить статус доступности до верификации квалификации администратором." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { availability } = body;

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