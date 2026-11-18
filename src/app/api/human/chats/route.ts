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

    let chats = [];

    if (user.role === "VOLUNTEER" || user.role === "PROFESSIONAL") {
      // Find chats where user is assigned helper
      chats = await prisma.humanChat.findMany({
        where: {
          helperId: user.id,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              anonymousId: true,
            },
          },
          request: {
            select: {
              category: true,
              priority: true,
              reason: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Find chats where user is client
      chats = await prisma.humanChat.findMany({
        where: {
          userId: user.id,
          status: "ACTIVE",
          helperId: { not: null },
        },
        include: {
          helper: {
            select: {
              id: true,
              anonymousId: true,
              role: true,
              profile: { select: { displayName: true } },
              volunteerProfile: { select: { status: true } },
              professionalProfile: { select: { displayName: true, qualification: true } },
            },
          },
          request: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching human chats:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

