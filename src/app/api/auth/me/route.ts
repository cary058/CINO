export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in me route:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, themePreference, language, notificationsEnabled } = body;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(themePreference !== undefined && { themePreference }),
        ...(language !== undefined && { language }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      },
      create: {
        userId: user.id,
        displayName: displayName?.trim() || "Пользователь",
        themePreference: themePreference || "NIGHT",
        language: language || "ru",
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Не удалось обновить профиль" }, { status: 500 });
  }
}