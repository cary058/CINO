export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    await prisma.userConsent.create({
      data: {
        userId: user.id,
        consentType: "HUMAN_RULES",
        documentVersion: "1.0",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting human rules:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}