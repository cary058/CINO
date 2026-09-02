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

    const chats = await prisma.aIChat.findMany({
      where: { userId: user.id, status: { not: "DELETED" } },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching AI chats:", error);
    return NextResponse.json({ error: "Не удалось загрузить диалоги" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title?.trim() || "Новый разговор";
    const mode = body.mode || "LISTENING";

    const chat = await prisma.aIChat.create({
      data: {
        userId: user.id,
        title,
        mode,
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error("Error creating AI chat:", error);
    return NextResponse.json({ error: "Не удалось создать диалог" }, { status: 500 });
  }
}