"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, HeartHandshake, Clock, ShieldCheck, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { RulesModal } from "./RulesModal";
import { HumanRequestCategory, SessionUser } from "@/types";

interface Message {
  id: string;
  senderType: "USER" | "COORDINATOR" | "VOLUNTEER" | "PROFESSIONAL" | "SYSTEM";
  senderName?: string;
  content: string;
  createdAt: string;
}

interface ActiveRequest {
  id: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  chat?: {
    id: string;
    helper?: {
      id: string;
      role: string;
      anonymousId: string;
      profile?: { displayName: string };
    };
  };
}

interface CoordinatorChatViewProps {
  user: SessionUser | null;
}

export function CoordinatorChatView({ user }: CoordinatorChatViewProps) {
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<HumanRequestCategory>("DONT_KNOW");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadActiveRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/human-requests");
      if (res.ok) {
        const data = await res.json();
        setActiveRequest(data.activeRequest || null);
        if (data.activeRequest?.chat?.id) {
          loadChatMessages(data.activeRequest.chat.id);
        }
      }
    } catch (err) {
      console.error("Error loading human request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/human/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = (data.chat?.messages || []).map((m: any) => ({
          id: m.id,
          senderType: m.senderRole === "USER" ? "USER" : "COORDINATOR",
          senderName: m.sender?.profile?.displayName || "Направляющий",
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(formatted);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Error loading coordinator messages:", err);
    }
  };

  useEffect(() => {
    loadActiveRequest();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRequestError("");
    try {
      const res = await fetch("/api/human-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, category }),
      });
      if (res.ok) {
        await res.json();
        setShowRequestModal(false);
        setReason("");
        await loadActiveRequest();
      } else {
        const data = await res.json().catch(() => ({}));
        setRequestError(data.error || "Не получилось отправить обращение. Попробуйте ещё раз.");
      }
    } catch (err) {
      console.error("Error submitting human request:", err);
      setRequestError("Нет связи с сервером. Обращение не отправлено; проверьте интернет и попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeRequest?.chat?.id) return;

    if (!user?.hasAcceptedHumanRules) {
      setShowRulesModal(true);
      return;
    }

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderType: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/human/chats/${activeRequest.chat.id}/messages`, {
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
            senderType: "USER",
            content: data.message.content,
            createdAt: data.message.createdAt,
          },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-2 md:px-6">
      <RulesModal
        isOpen={showRulesModal}
        onAccept={() => {
          setShowRulesModal(false);
          if (user) user.hasAcceptedHumanRules = true;
        }}
        onCancel={() => setShowRulesModal(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-300" />
            <span>Чат с направляющим</span>
          </h2>
          <p className="text-xs text-blue-200/70">
            Направляющий поможет понять, какая помощь и формат поддержки вам сейчас ближе.
          </p>
        </div>

        {activeRequest && (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs text-blue-200 font-medium">
            {activeRequest.status === "QUEUED" ? "В очереди" : "Активно"}
          </span>
        )}
      </div>

      {/* Main Area */}
      {!activeRequest ? (
        /* No active request: Invitation to request a human helper */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shadow-xl">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-white">Хотите поговорить с живым человеком?</h3>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Направляющий дежурит на платформе, чтобы выслушать ваш запрос и при необходимости соединить вас с подходящим волонтёром или психологом.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-xl shadow-blue-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Мне нужен человек</span>
          </button>
        </div>
      ) : (
        /* Active or Queued Request Chat Area */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Status banner if queued */}
          {activeRequest.status === "QUEUED" && (
            <div className="flex items-center gap-3 p-3.5 mb-3 rounded-2xl bg-[#182b54]/60 border border-blue-300/20 text-xs text-blue-100 backdrop-blur-md">
              <Clock className="w-4 h-4 text-blue-300 animate-pulse flex-shrink-0" />
              <div>
                <strong>Ваш запрос находится в очереди.</strong>
                <p className="text-[11px] text-blue-200/70">Дежурный направляющий подключится к разговору в ближайшие минуты.</p>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-1 py-3 space-y-3">
            <div className="flex justify-center my-2">
              <div className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-blue-200/70">
                Запрос создан • {new Date(activeRequest.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                senderType={msg.senderType}
                senderName={msg.senderName}
                createdAt={msg.createdAt}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="pt-2 pb-2">
            <MessageComposer
              onSendMessage={handleSendMessage}
              placeholder="Напишите направляющему..."
            />
          </div>
        </div>
      )}

      {/* Intake Request Modal ("Что сейчас происходит?") */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-blue-300/25 shadow-2xl text-blue-100 backdrop-blur-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Обращение к направляющему</h3>
            <p className="text-xs text-blue-200/70 mb-4">
              Расскажите в двух словах, чтобы мы подобрали наиболее бережный формат помощи.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              {requestError && (
                <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-red-200">
                  {requestError}
                </p>
              )}
              <div>
                <label className="block text-blue-200 font-medium mb-1.5">Что сейчас происходит?</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Опишите, что у вас на душе (необязательно)..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-blue-200 font-medium mb-1.5">Что тебе сейчас больше всего нужно?</label>
                <div className="space-y-1.5">
                  {[
                    { val: "JUST_TALK", label: "Просто выговориться" },
                    { val: "NEED_HUMAN", label: "Поговорить с человеком" },
                    { val: "NEED_SUPPORT", label: "Мне нужна поддержка" },
                    { val: "DONT_KNOW", label: "Я не знаю" },
                    { val: "OTHER", label: "Другое" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        category === opt.val
                          ? "bg-blue-600/30 border-blue-400 text-white font-medium"
                          : "bg-white/5 border-white/10 text-blue-200/80 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={opt.val}
                        checked={category === opt.val}
                        onChange={(e) => setCategory(e.target.value as HumanRequestCategory)}
                        className="text-blue-500 focus:ring-0"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all"
                >
                  {isSubmitting ? "Отправка..." : "Отправить запрос"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

