import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { realtimeBus } from "@/lib/realtime/eventBus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const userId = user?.id || "anonymous";

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial ping
  writer.write(encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId, connectedAt: Date.now() })}\n\n`));

  // Subscribe to user personal channel
  const unsubUser = realtimeBus.subscribe(`user:${userId}`, (data) => {
    writer.write(encoder.encode(`event: ${data.event || "message"}\ndata: ${JSON.stringify(data)}\n\n`));
  });

  // Subscribe to chat channel if provided
  let unsubChat: (() => void) | null = null;
  if (chatId) {
    unsubChat = realtimeBus.subscribe(`chat:${chatId}`, (data) => {
      writer.write(encoder.encode(`event: chat_update\ndata: ${JSON.stringify(data)}\n\n`));
    });
  }

  // Heartbeat keep-alive every 20 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 20000);

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    unsubUser();
    if (unsubChat) unsubChat();
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}