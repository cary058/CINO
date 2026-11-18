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
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [professionalDetails, setProfessionalDetails] = useState({
    displayName: "",
    education: "",
    qualification: "",
    specializations: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

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
        if (data.professional) {
          setProfessionalDetails({
            displayName: data.professional.displayName || "",
            education: data.professional.education || "",
            qualification: data.professional.qualification || "",
            specializations: data.professional.specializations || "",
          });
        }
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
    const previousStatus = availability;
    setIsSavingAvailability(true);
    setAvailabilityMessage("");
    try {
      const res = await fetch("/api/professional/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Статус не удалось сохранить.");

      setAvailability(data.professional.availability);
      setProProfile(data.professional);
      setAvailabilityMessage("Статус сохранён и будет виден направляющему.");
    } catch (err) {
      console.error("Error updating pro status:", err);
      setAvailability(previousStatus);
      setAvailabilityMessage(err instanceof Error ? err.message : "Не удалось сохранить статус. Попробуйте ещё раз.");
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/professional/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(professionalDetails),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить профиль на проверку.");
      setProProfile(data.profile);
      setProfileMessage(data.message || "Профиль отправлен на проверку администратору.");
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Не удалось сохранить профиль.");
    } finally {
      setIsSavingProfile(false);
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
              <span className="px-2 text-purple-200/70">Статус:</span>
              <button
                onClick={() => handleStatusChange("AVAILABLE")}
                disabled={isSavingAvailability || !proProfile}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "AVAILABLE"
                    ? "bg-purple-600 text-white font-semibold shadow-md"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Свободен
              </button>
              <button
                onClick={() => handleStatusChange("BUSY")}
                disabled={isSavingAvailability || !proProfile}
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
                disabled={isSavingAvailability || !proProfile}
                className={`px-3 py-1 rounded-xl transition-all ${
                  availability === "OFFLINE"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-purple-200/70 hover:text-white"
                }`}
              >
                Не на смене
              </button>
            </div>
            {availabilityMessage && (
              <span role="status" className={`max-w-48 ${availabilityMessage.includes("сохранён") ? "text-emerald-300" : "text-amber-200"}`}>
                {availabilityMessage}
              </span>
            )}
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
            >
              ← Главная
            </a>
          </div>
        </header>

        {proProfile?.verificationStatus === "PENDING" && (
          <form onSubmit={handleProfileSubmit} className="mb-3 rounded-2xl bg-[#101c38]/85 border border-amber-300/20 p-3 md:p-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Заполните профиль для проверки</h2>
              <p className="mt-1 text-[11px] text-amber-100/70">Пока профиль не одобрен, направляющий видит статус, но не может назначить вас на обращение.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input required value={professionalDetails.displayName} onChange={(e) => setProfessionalDetails({ ...professionalDetails, displayName: e.target.value })} placeholder="Имя для кабинета" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-blue-200/40" />
              <input required value={professionalDetails.education} onChange={(e) => setProfessionalDetails({ ...professionalDetails, education: e.target.value })} placeholder="Образование" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-blue-200/40" />
              <input required value={professionalDetails.qualification} onChange={(e) => setProfessionalDetails({ ...professionalDetails, qualification: e.target.value })} placeholder="Квалификация" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-blue-200/40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={professionalDetails.specializations} onChange={(e) => setProfessionalDetails({ ...professionalDetails, specializations: e.target.value })} placeholder="Специализации (необязательно)" className="min-w-56 flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-blue-200/40" />
              <button type="submit" disabled={isSavingProfile} className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 text-xs text-white font-semibold">
                {isSavingProfile ? "Сохраняю…" : "Отправить на проверку"}
              </button>
            </div>
            {profileMessage && <p role="status" className="text-xs text-amber-100">{profileMessage}</p>}
          </form>
        )}

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

