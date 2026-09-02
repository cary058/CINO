"use client";

import React, { useState, useEffect, useRef } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { Stethoscope, User, ShieldCheck, ArrowRightLeft, AlertTriangle, XCircle, Clock } from "lucide-react";
import { AvailabilityStatus } from "@/types";

interface AssignedChat {
  id: string;
  status: string;
  user: {
    id: string;
    anonymousId: string;
  };
  request?: {
    category: string;
    priority: string;
    reason: string;
  };
}

interface Message {
  id: string;
  senderType: "USER" | "PROFESSIONAL" | "SYSTEM";
  senderName?: string;
  content: string;
  createdAt: string;
  contactWarning?: string;
}

export default function PsychologistDashboardPage() {
  const [proProfile, setProProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<AvailabilityStatus>("OFFLINE");
  const [activeChats, setActiveChats] = useState<AssignedChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/professional/status");
      if (res.ok) {
        const data = await res.json();
        setProProfile(data.professional);
        setAvailability(data.professional?.availability || "OFFLINE");
      }

      const chatsRes = await fetch("/api/human/chats");
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setActiveChats(chatsData.chats || []);
        if (chatsData.chats?.length > 0 && !selectedChatId) {
          setSelectedChatId(chatsData.chats[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading psychologist dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/human/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = (data.chat?.messages || []).map((m: any) => ({
          id: m.id,
          senderType: m.senderRole === "USER" ? "USER" : (m.senderRole as any),
          senderName: m.sender?.profile?.displayName || "Пользователь",
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(formatted);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const handleStatusChange = async (status: AvailabilityStatus) => {
    setAvailability(status);
    try {
      await fetch("/api/professional/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: status }),
      });
    } catch (err) {
      console.error("Error updating pro status:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderType: "PROFESSIONAL",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/human/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticMsg.id),
          {
            id: data.message.id,
            senderType: "PROFESSIONAL",
            content: data.message.content,
            createdAt: data.message.createdAt,
            contactWarning: data.contactWarning,
          },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setTimeout(scrollToBottom, 100);
    }
  };

  const selectedChat = activeChats.find((c) => c.id === selectedChatId);

  return (
    <main className="relative flex h-screen w-screen bg-[#091024] text-blue-100 font-sans overflow-hidden">
      <StarBackground />

      <div className="relative flex flex-col flex-1 h-full max-w-7xl mx-auto p-3 md:p-6 z-10 overflow-hidden">
        {/* Top Control Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 p-4 mb-3 rounded-3xl bg-[#101c38]/85 border border-purple-400/20 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <EarIcon size={26} glow />
              <span className="font-bold tracking-wider text-white">СИНО</span>
            </a>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-semibold flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Кабинет верифицированного психолога</span>
            </span>
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => handleStatusChange("AVAILABLE")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "AVAILABLE"
                    ? "bg-purple-600 text-white font-semibold shadow-md"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                На приёме (Онлайн)
              </button>
              <button
                onClick={() => handleStatusChange("BUSY")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "BUSY"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Занят(а)
              </button>
              <button
                onClick={() => handleStatusChange("OFFLINE")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "OFFLINE"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Не на смене
              </button>
            </div>
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
            >
              ← Главная
            </a>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {/* Active Client Chats List */}
          <div className="p-4 rounded-3xl bg-[#101c38]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Пациенты / Обращения</span>
              <span className="text-xs text-purple-300/70 font-normal">{activeChats.length} акт.</span>
            </h3>

            {activeChats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-blue-200/70 space-y-2">
                <Clock className="w-8 h-8 opacity-40 mb-1" />
                <p>Нет назначенных консультаций.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedChatId === chat.id
                        ? "bg-[#332560]/80 border-purple-400/40 text-white shadow-md"
                        : "bg-white/5 hover:bg-white/10 border-white/5 text-blue-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-purple-200">{chat.user?.anonymousId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-medium">
                        {chat.request?.priority || "Средний"}
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/70 truncate">{chat.request?.reason || "Психологическая консультация"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Live Chat Window */}
          <div className="md:col-span-2 flex flex-col rounded-3xl bg-[#111f3f]/80 border border-white/10 backdrop-blur-xl shadow-xl p-4 overflow-hidden">
            {selectedChat ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-300" />
                      <span>Клиент: {selectedChat.user?.anonymousId}</span>
                    </h4>
                    <p className="text-[11px] text-blue-300/70">
                      Запрос: {selectedChat.request?.reason || "Консультация"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-1 py-3 space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      content={msg.content}
                      senderType={msg.senderType}
                      senderName={msg.senderName}
                      createdAt={msg.createdAt}
                      contactWarning={msg.contactWarning}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="pt-2">
                  <MessageComposer
                    onSendMessage={handleSendMessage}
                    placeholder="Напишите профессиональный поддерживающий ответ..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-blue-200/70 space-y-2">
                <Stethoscope className="w-12 h-12 opacity-30 text-purple-300" />
                <p>Выберите обращение из списка слева для начала консультации.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}