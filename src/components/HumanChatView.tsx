"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, ShieldCheck, Flag, UserCheck, Stethoscope, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { RulesModal } from "./RulesModal";
import { ReportModal } from "./ReportModal";
import { SessionUser } from "@/types";

interface Message {
  id: string;
  senderType: "USER" | "COORDINATOR" | "VOLUNTEER" | "PROFESSIONAL" | "SYSTEM";
  senderName?: string;
  content: string;
  createdAt: string;
  contactWarning?: string;
}

interface HumanChat {
  id: string;
  status: string;
  helperRole: string;
  helper?: {
    id: string;
    anonymousId: string;
    role: string;
    profile?: { displayName: string };
    professionalProfile?: {
      displayName: string;
      qualification: string;
      verificationStatus: string;
    };
  };
}

interface HumanChatViewProps {
  user: SessionUser | null;
}

export function HumanChatView({ user }: HumanChatViewProps) {
  const [activeChat, setActiveChat] = useState<HumanChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHumanChats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/human/chats");
      if (res.ok) {
        const data = await res.json();
        const first = data.chats?.[0] || null;
        setActiveChat(first);
        if (first?.id) {
          loadChatMessages(first.id);
        }
      }
    } catch (err) {
      console.error("Error loading human chats:", err);
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
          senderType: m.senderRole === "USER" ? "USER" : (m.senderRole as any),
          senderName: m.sender?.profile?.displayName || "Собеседник",
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(formatted);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Error loading human messages:", err);
    }
  };

  useEffect(() => {
    loadHumanChats();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!activeChat?.id) return;

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
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/human/chats/${activeChat.id}/messages`, {
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

  const helperName = activeChat?.helper?.professionalProfile?.displayName || activeChat?.helper?.profile?.displayName || "Человек поддержки";
  const isPsychologist = activeChat?.helperRole === "PROFESSIONAL";

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

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={activeChat?.helper?.id}
        conversationId={activeChat?.id}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-300" />
            <span>Чат с человеком</span>
          </h2>
          <p className="text-xs text-blue-200/70">
            Личный защищённый диалог с волонтёром или проверенным психологом.
          </p>
        </div>

        {activeChat && (
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-xs text-red-200 transition-colors"
            title="Пожаловаться на нарушение"
          >
            <Flag className="w-3.5 h-3.5 text-red-300" />
            <span>Пожаловаться</span>
          </button>
        )}
      </div>

      {!activeChat ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-300 shadow-xl">
            <Heart className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-white">Пока никто не подключён</h3>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Чтобы начать разговор с живым человеком поддержки или психологом, перейдите во вкладку «Чат с направляющим» и создайте обращение.
            </p>
          </div>
        </div>
      ) : (
        /* Active Human Chat */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Helper Card */}
          <div className="p-3 mb-2 rounded-2xl bg-[#14244a]/70 border border-blue-300/20 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-200 font-bold">
                {helperName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{helperName}</h4>
                  {isPsychologist ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] text-purple-200 font-medium">
                      <Stethoscope className="w-3 h-3" />
                      <span>Психолог (Верифицирован)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] text-blue-200 font-medium">
                      <UserCheck className="w-3 h-3" />
                      <span>Волонтёр поддержки</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-200/70 mt-0.5">
                  {isPsychologist
                    ? activeChat.helper?.professionalProfile?.qualification || "Квалифицированный специалист"
                    : "Прошёл обязательное обучение активному слушанию СИНО"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages list */}
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
          <div className="pt-2 pb-2">
            <MessageComposer
              onSendMessage={handleSendMessage}
              placeholder="Напишите сообщение человеку поддержки..."
            />
          </div>
        </div>
      )}
    </div>
  );
}