export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const chat = await prisma.aIChat.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat || chat.status === "DELETED") {
      return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
    }

    // IDOR check
    if (chat.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const chat = await prisma.aIChat.findUnique({
      where: { id: params.id },
    });

    if (!chat || chat.status === "DELETED") {
      return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
    }

    if (chat.userId !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { title, mode, status } = body;

    const updated = await prisma.aIChat.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(mode !== undefined && { mode }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ success: true, chat: updated });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json({ error: "Не удалось обновить диалог" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const chat = await prisma.aIChat.findUnique({
      where: { id: params.id },
    });

    if (!chat) {
      return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
    }

    if (chat.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    await prisma.aIChat.update({
      where: { id: params.id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json({ error: "Не удалось удалить диалог" }, { status: 500 });
  }
}