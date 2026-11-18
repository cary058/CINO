import { NextRequest, NextResponse } from "next/server";
import { getTelegramWebhookSecret, handleTelegramUpdate } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = getTelegramWebhookSecret();
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

