"use client";

import React, { useState, useEffect, useRef } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { HeartHandshake, User, ArrowRightLeft, AlertTriangle, CheckCircle, Shield, XCircle, Clock } from "lucide-react";
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
  senderType: "USER" | "VOLUNTEER" | "SYSTEM";
  senderName?: string;
  content: string;
  createdAt: string;
  contactWarning?: string;
}

export default function VolunteerDashboardPage() {
  const [volProfile, setVolProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<AvailabilityStatus>("OFFLINE");
  const [activeChats, setActiveChats] = useState<AssignedChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer & Escalate Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferReason, setTransferReason] = useState("");
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/volunteer/status");
      if (res.ok) {
        const data = await res.json();
        setVolProfile(data.volunteer);
        setAvailability(data.volunteer?.availability || "OFFLINE");
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
      console.error("Error loading volunteer dashboard:", err);
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
      await fetch("/api/volunteer/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: status }),
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderType: "VOLUNTEER",
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
            senderType: "VOLUNTEER",
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

  const handleTransfer = async () => {
    const chat = activeChats.find((c) => c.id === selectedChatId);
    if (!chat) return;

    try {
      await fetch("/api/coordinator/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: (chat as any).requestId || chat.id,
          reason: transferReason || "Передача по запросу волонтёра",
        }),
      });
      setShowTransferModal(false);
      loadDashboard();
    } catch (err) {
      console.error("Transfer error:", err);
    }
  };

  const handleEscalate = async () => {
    const chat = activeChats.find((c) => c.id === selectedChatId);
    if (!chat) return;

    try {
      await fetch("/api/coordinator/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: (chat as any).requestId || chat.id,
          escalationTarget: "COORDINATOR",
          reason: escalateReason || "Кризисная ситуация в диалоге",
          riskLevel: "CRITICAL",
        }),
      });
      setShowEscalateModal(false);
      loadDashboard();
    } catch (err) {
      console.error("Escalate error:", err);
    }
  };

  const handleCloseChat = async () => {
    const chat = activeChats.find((c) => c.id === selectedChatId);
    if (!chat) return;

    if (!confirm("Завершить этот диалог поддержки?")) return;

    try {
      await fetch("/api/coordinator/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: (chat as any).requestId || chat.id,
          closeReason: "Завершено волонтёром после диалога",
        }),
      });
      loadDashboard();
    } catch (err) {
      console.error("Close error:", err);
    }
  };

  const selectedChat = activeChats.find((c) => c.id === selectedChatId);

  return (
    <main className="relative flex h-screen w-screen bg-[#091024] text-blue-100 font-sans overflow-hidden">
      <StarBackground />

      <div className="relative flex flex-col flex-1 h-full max-w-7xl mx-auto p-3 md:p-6 z-10 overflow-hidden">
        {/* Top Control Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 p-4 mb-3 rounded-3xl bg-[#101c38]/85 border border-blue-300/20 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <EarIcon size={26} glow />
              <span className="font-bold tracking-wider text-white">СИНО</span>
            </a>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
              Кабинет волонтёра
            </span>
          </div>

          {/* Availability Status Selector & Capacity */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-blue-200">
              <span>Диалогов: </span>
              <strong className="text-white font-bold">{activeChats.length} / 2 (макс)</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => handleStatusChange("AVAILABLE")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "AVAILABLE"
                    ? "bg-emerald-600 text-white font-semibold shadow-md"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                Я доступен(на)
              </button>
              <button
                onClick={() => handleStatusChange("BUSY")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "BUSY"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                Занят(а)
              </button>
              <button
                onClick={() => handleStatusChange("OFFLINE")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "OFFLINE"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                Не на смене
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {/* Left Roster: Active Assigned Chats */}
          <div className="p-4 rounded-3xl bg-[#101c38]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Назначенные диалоги</span>
              <span className="text-xs text-blue-300/60 font-normal">{activeChats.length} акт.</span>
            </h3>

            {activeChats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-blue-200/70 space-y-2">
                <Clock className="w-8 h-8 opacity-40 mb-1" />
                <p>Нет активных обращений.</p>
                <p className="text-[11px] text-blue-300/50">
                  Когда координатор назначит вам разговор, он появится здесь.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedChatId === chat.id
                        ? "bg-[#254178]/80 border-blue-300/40 text-white shadow-md"
                        : "bg-white/5 hover:bg-white/10 border-white/5 text-blue-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-sky-200">{chat.user?.anonymousId || "SINO-USER"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                        {chat.request?.category || "Диалог"}
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/70 truncate">{chat.request?.reason || "Запрос эмоциональной поддержки"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center/Right: Live Messaging with Client */}
          <div className="md:col-span-2 flex flex-col rounded-3xl bg-[#111f3f]/80 border border-white/10 backdrop-blur-xl shadow-xl p-4 overflow-hidden">
            {selectedChat ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Chat Top Controls (Transfer, Escalate, Close) */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-300" />
                      <span>Собеседник: {selectedChat.user?.anonymousId}</span>
                    </h4>
                    <p className="text-[11px] text-blue-300/70">
                      Категория: {selectedChat.request?.category || "Поддержка"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-blue-200 flex items-center gap-1.5 transition-colors"
                      title="Передать другому специалисту"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Передать</span>
                    </button>

                    <button
                      onClick={() => setShowEscalateModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 text-xs text-amber-200 flex items-center gap-1.5 transition-colors"
                      title="Кризисная эскалация"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">Эскалировать</span>
                    </button>

                    <button
                      onClick={handleCloseChat}
                      className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-xs text-red-200 flex items-center gap-1.5 transition-colors"
                      title="Завершить диалог"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-300" />
                      <span className="hidden sm:inline">Завершить</span>
                    </button>
                  </div>
                </div>

                {/* Messages List */}
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

                {/* Composer */}
                <div className="pt-2">
                  <MessageComposer
                    onSendMessage={handleSendMessage}
                    placeholder="Напишите бережный ответ..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-blue-200/70 space-y-2">
                <HeartHandshake className="w-12 h-12 opacity-30" />
                <p>Выберите диалог из списка слева для начала общения.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-blue-300/25 shadow-2xl text-blue-100 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Передать обращение координатору</h3>
            <p className="text-blue-200/70">Укажите причину для перенаправления диалога:</p>
            <textarea
              rows={3}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Нужен психолог / перегрузка / завершение смены..."
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 text-blue-200"
              >
                Отмена
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Передать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-amber-400/30 shadow-2xl text-blue-100 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Кризисная эскалация</h3>
            </div>
            <p className="text-blue-200/80">
              Обращение будет немедленно поднято в очереди с критическим приоритетом и передано дежурному координатору и старшему психологу.
            </p>
            <textarea
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Опишите угрозу (суицидальный риск, прямая угроза жизни)..."
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 text-blue-200"
              >
                Отмена
              </button>
              <button
                onClick={handleEscalate}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                Подтвердить эскалацию
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
