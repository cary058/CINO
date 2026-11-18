export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectPersonalContacts } from "@/lib/moderation/contactDetector";
import { checkRateLimit } from "@/lib/rateLimit";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const rate = checkRateLimit(`human-msg:${user.id}`, 30, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Слишком много сообщений. Пожалуйста, подождите." },
        { status: 429 }
      );
    }

    const chat = await prisma.humanChat.findUnique({
      where: { id: params.id },
      include: { request: true },
    });

    if (!chat || chat.status === "CLOSED") {
      return NextResponse.json({ error: "Чат закрыт или не существует" }, { status: 400 });
    }

    const isParticipant =
      chat.userId === user.id ||
      chat.helperId === user.id ||
      ["COORDINATOR", "ADMIN", "SUPER_ADMIN"].includes(user.role);

    if (!isParticipant) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
    }

    const messageText = content.trim();

    // Check contact exchange detector (Requirement 26)
    const contactCheck = detectPersonalContacts(messageText);

    const savedMessage = await prisma.humanMessage.create({
      data: {
        chatId: chat.id,
        senderId: user.id,
        senderRole: user.role,
        content: messageText,
      },
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
    });

    // Notify recipient via realtime bus
    const recipientId = chat.userId === user.id ? chat.helperId : chat.userId;
    if (recipientId) {
      realtimeBus.emit(`user:${recipientId}`, "new_human_message", {
        chatId: chat.id,
        message: savedMessage,
      });
    }

    // Deliver coordinator/helper replies to demo users who started in Telegram.
    if (user.id !== chat.userId) {
      const recipient = await prisma.user.findUnique({ where: { id: chat.userId }, select: { telegramChatId: true } });
      if (recipient?.telegramChatId) {
        try {
          await sendTelegramMessage(recipient.telegramChatId, `Ответ координатора:\n\n${messageText}`);
        } catch (telegramError) {
          console.error("Could not deliver Telegram human-support reply", telegramError);
        }
      }
    }

    // Broadcast on chat channel
    realtimeBus.emit(`human_chat:${chat.id}`, "message", {
      message: savedMessage,
    });

    return NextResponse.json({
      success: true,
      message: savedMessage,
      contactWarning: contactCheck.warningMessage,
    });
  } catch (error) {
    console.error("Error sending human message:", error);
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 500 });
  }
}

