export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const chat = await prisma.humanChat.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            anonymousId: true,
            role: true,
            profile: { select: { displayName: true } },
          },
        },
        helper: {
          select: {
            id: true,
            anonymousId: true,
            role: true,
            profile: { select: { displayName: true } },
            volunteerProfile: { select: { status: true } },
            professionalProfile: { select: { displayName: true, qualification: true, verificationStatus: true } },
          },
        },
        request: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                anonymousId: true,
                role: true,
                profile: { select: { displayName: true } },
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Чат не найден" }, { status: 404 });
    }

    // Access check: must be the user, helper, coordinator, or admin
    const isParticipant =
      chat.userId === user.id ||
      chat.helperId === user.id ||
      hasPermission(user.role, "coordinator:dashboard");

    if (!isParticipant) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error fetching human chat:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

