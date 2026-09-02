export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "coordinator:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, content } = body;

    if (!requestId || !content || !content.trim()) {
      return NextResponse.json({ error: "Текст заметки не может быть пустым" }, { status: 400 });
    }

    const note = await prisma.internalNote.create({
      data: {
        requestId,
        authorId: user.id,
        authorRole: user.role,
        content: content.trim(),
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "ADD_INTERNAL_NOTE",
      targetType: "InternalNote",
      targetId: note.id,
      metadata: { requestId },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("Error creating internal note:", error);
    return NextResponse.json({ error: "Не удалось сохранить заметку" }, { status: 500 });
  }
}