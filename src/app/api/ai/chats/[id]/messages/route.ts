export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/factory";
import { checkRateLimit } from "@/lib/rateLimit";
import { realtimeBus } from "@/lib/realtime/eventBus";
import { AIMode } from "@/types";
import { analyzeMessageSafety } from "@/lib/ai/safetyLayer";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Rate limiting: 20 messages per minute
    const rateCheck = checkRateLimit(`ai-msg:${user.id}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Слишком частая отправка сообщений. Пожалуйста, сделайте небольшую паузу." },
        { status: 429 }
      );
    }

    // Check Kill Switch
    const aiSetting = await prisma.systemSetting.findUnique({ where: { key: "ENABLE_AI" } });
    if (aiSetting && aiSetting.value === "false") {
      return NextResponse.json(
        { error: "ИИ временно недоступен по решению администратора." },
        { status: 503 }
      );
    }

    const chat = await prisma.aIChat.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          take: 12,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!chat || chat.status === "DELETED") {
      return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
    }

    if (chat.userId !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await req.json();
    const { content, mode } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
    }

    const userMessageContent = content.trim();
    const currentMode: AIMode = mode || (chat.mode as AIMode) || "LISTENING";

    // Format chat history for AI context
    const history = chat.messages
      .reverse()
      .map((m) => ({
        role: (m.senderType === "AI" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      }));

    // Persist the user's message before calling an external provider. If the
    // provider times out, the conversation still survives refreshes/devices.
    const savedUserMsg = await prisma.aIMessage.create({
      data: {
        chatId: chat.id,
        senderType: "USER",
        content: userMessageContent,
      },
    });

    // AI Generation. Keep the conversation usable when a provider is down.
    let aiResponse;
    try {
      const aiProvider = getAIProvider();
      aiResponse = await aiProvider.generateResponse({
        userMessage: userMessageContent,
        history,
        requestedMode: currentMode,
      });
    } catch (providerError) {
      console.error("AI provider failed after user message was saved:", providerError);
      const safety = analyzeMessageSafety(userMessageContent);
      aiResponse = {
        content: "Я получил твоё сообщение и сохранил его. Сейчас не получается подготовить ответ. Попробуй немного позже — написанное останется в этом диалоге.",
        safety,
        detectedMode: currentMode,
      };
    }

    await prisma.aIMessage.update({
      where: { id: savedUserMsg.id },
      data: {
        safetyCategory: aiResponse.safety.category,
        safetyLevel: aiResponse.safety.riskLevel,
      },
    });

    // Save AI response message
    const savedAiMsg = await prisma.aIMessage.create({
      data: {
        chatId: chat.id,
        senderType: "AI",
        content: aiResponse.content,
        safetyCategory: aiResponse.safety.category,
        safetyLevel: aiResponse.safety.riskLevel,
      },
    });

    // If High or Critical risk, log safety event for review
    if (aiResponse.safety.riskLevel === "HIGH" || aiResponse.safety.riskLevel === "CRITICAL") {
      await prisma.safetyEvent.create({
        data: {
          userId: user.id,
          conversationId: chat.id,
          source: "AI_CHAT",
          category: aiResponse.safety.category,
          riskLevel: aiResponse.safety.riskLevel,
          status: "OPEN",
          actionTaken: "CRISIS_RESPONSE_TRIGGERED",
        },
      });
    }

    // Update chat timestamp and title if first message
    const totalCount = await prisma.aIMessage.count({ where: { chatId: chat.id } });
    if (totalCount <= 2 && chat.title === "Новый разговор") {
      const autoTitle = userMessageContent.slice(0, 32) + (userMessageContent.length > 32 ? "..." : "");
      await prisma.aIChat.update({
        where: { id: chat.id },
        data: { title: autoTitle, updatedAt: new Date() },
      });
    } else {
      await prisma.aIChat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() },
      });
    }

    // Broadcast to realtime bus
    realtimeBus.emit(`chat:${chat.id}`, "new_message", {
      userMessage: savedUserMsg,
      aiMessage: savedAiMsg,
    });

    return NextResponse.json({
      success: true,
      userMessage: savedUserMsg,
      aiMessage: savedAiMsg,
      safety: aiResponse.safety,
      detectedMode: aiResponse.detectedMode,
      crisisData: aiResponse.crisisData,
    });
  } catch (error: any) {
    console.error("Error processing AI message:", error);
    return NextResponse.json(
      { error: "Не удалось отправить сообщение. Пожалуйста, попробуйте снова." },
      { status: 500 }
    );
  }
}

