import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/factory";
import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";

type TelegramButton = { text: string; callback_data: string };

export function getTelegramWebhookSecret() {
  const configured = process.env.TELEGRAM_WEBHOOK_SECRET;
  return configured ? createHash("sha256").update(configured).digest("base64url") : null;
}

async function telegram(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Telegram API returned ${response.status}`);
  return response.json();
}

export async function sendTelegramMessage(chatId: string, text: string, keyboard?: TelegramButton[][]) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    link_preview_options: { is_disabled: true },
  });
}

async function getOrCreateUser(chatId: string) {
  const existing = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
  if (existing) return existing;
  const suffix = randomUUID();
  return prisma.user.create({
    data: {
      email: `telegram-${suffix}@demo.sino.invalid`,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
      anonymousId: `SINO-${randomBytes(3).toString("hex").toUpperCase()}`,
      telegramChatId: chatId,
      profile: { create: { displayName: "Гость Telegram", language: "ru" } },
      consents: {
        create: ["TERMS", "PRIVACY", "AI_ACKNOWLEDGEMENT", "LIMITATIONS", "HUMAN_RULES"].map((consentType) => ({ consentType })),
      },
    },
  });
}

const menu = [[
  { text: "💬 Вернуться к ИИ (отменить запрос)", callback_data: "talk" },
  { text: "🤝 Позвать человека", callback_data: "human" },
]];

async function handleText(chatId: string, text: string) {
  const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
  if (!user) {
    await sendTelegramMessage(chatId, "Сначала нажми /start и подтверди, что понимаешь правила демо.");
    return;
  }
  const activeRequest = await prisma.humanSupportRequest.findFirst({
    where: { userId: user.id, status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] } },
    include: { chat: true },
    orderBy: { createdAt: "desc" },
  });
  if (activeRequest?.chat) {
    await prisma.humanMessage.create({
      data: { chatId: activeRequest.chat.id, senderId: user.id, senderRole: "USER", content: text },
    });
    await sendTelegramMessage(chatId, "Сообщение передано в комнату управления. Ответ придёт сюда, когда координатор подключится.");
    return;
  }

  let chat = await prisma.aIChat.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { updatedAt: "desc" } });
  if (!chat) chat = await prisma.aIChat.create({ data: { userId: user.id, title: "Разговор из Telegram" } });
  const history = await prisma.aIMessage.findMany({ where: { chatId: chat.id }, orderBy: { createdAt: "asc" }, take: 20 });
  const reply = await getAIProvider().generateResponse({
    userMessage: text,
    history: history.map((item) => ({ role: item.senderType === "USER" ? "user" : "assistant", content: item.content })),
    requestedMode: "LISTENING",
  });
  await prisma.aIMessage.create({
    data: { chatId: chat.id, senderType: "USER", content: text, safetyCategory: reply.safety.category, safetyLevel: reply.safety.riskLevel },
  });
  await prisma.aIMessage.create({
    data: { chatId: chat.id, senderType: "AI", content: reply.content, safetyCategory: reply.safety.category, safetyLevel: reply.safety.riskLevel },
  });
  await sendTelegramMessage(chatId, reply.content, menu);
}

export async function handleTelegramUpdate(update: any) {
  const message = update?.message;
  const callback = update?.callback_query;
  const rawChatId = message?.chat?.id ?? callback?.message?.chat?.id;
  if (rawChatId === undefined || rawChatId === null) return;
  const chatId = String(rawChatId);

  if (callback) {
    const data = String(callback.data || "");
    await telegram("answerCallbackQuery", { callback_query_id: callback.id });
    if (data === "consent") {
      await getOrCreateUser(chatId);
      await sendTelegramMessage(chatId, "Спасибо. Это демонстрация: используй только вымышленные данные. Напиши сообщение — я отвечу, или выбери действие:", menu);
    } else if (data === "talk") {
      const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
      const activeRequest = user
        ? await prisma.humanSupportRequest.findFirst({
            where: {
              userId: user.id,
              status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] },
            },
            include: { chat: true },
            orderBy: { createdAt: "desc" },
          })
        : null;

      if (activeRequest) {
        const closedAt = new Date();
        await prisma.humanSupportRequest.update({
          where: { id: activeRequest.id },
          data: { status: "CANCELLED", closedAt },
        });
        if (activeRequest.chat) {
          await prisma.humanChat.update({
            where: { id: activeRequest.chat.id },
            data: { status: "CLOSED", closedAt },
          });
        }
        await sendTelegramMessage(chatId, "Запрос к человеку отменён. Теперь можешь писать сюда — я отвечу как ИИ. Если позже захочешь поговорить с человеком, нажми «Позвать человека».", menu);
        return;
      }

      await sendTelegramMessage(chatId, "Напиши, что у тебя на душе. Это демонстрационная поддержка на базе встроенного ИИ.");
    } else if (data === "human") {
      const user = await getOrCreateUser(chatId);
      const existing = await prisma.humanSupportRequest.findFirst({ where: { userId: user.id, status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] } } });
      if (existing) {
        await sendTelegramMessage(chatId, "Твой запрос уже в очереди. Напиши сообщение — оно попадёт в комнату управления.");
      } else {
        const request = await prisma.humanSupportRequest.create({ data: { userId: user.id, category: "NEED_SUPPORT", reason: "Запрос из Telegram", status: "QUEUED" } });
        await prisma.humanChat.create({ data: { requestId: request.id, userId: user.id, helperRole: "COORDINATOR", status: "ACTIVE" } });
        await sendTelegramMessage(chatId, "Готово: запрос создан и виден координатору в комнате управления. Пока координатор не назначен, можно оставить сообщение здесь.");
      }
    }
    return;
  }

  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (!text) return;
  if (text === "/start") {
    await sendTelegramMessage(chatId,
      "Привет! Это демонстрационный бот СИНО. Он сохраняет переписку в базе проекта и передаёт запросы в комнату управления. Пока используем только вымышленные аккаунты: не отправляй настоящие имена, телефоны, адреса и реальные личные истории.",
      [[{ text: "Понятно, продолжить", callback_data: "consent" }]],
    );
    return;
  }
  if (text === "/menu") {
    await sendTelegramMessage(chatId, "Что хочешь сделать?", menu);
    return;
  }
  await handleText(chatId, text.slice(0, 4000));
}

