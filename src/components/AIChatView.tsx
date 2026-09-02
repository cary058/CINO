"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { CrisisBanner } from "./CrisisBanner";
import { EarIcon } from "./EarIcon";
import { AIMode } from "@/types";

interface Message {
  id: string;
  senderType: "USER" | "AI" | "SYSTEM";
  content: string;
  createdAt: string;
  contactWarning?: string;
}

interface ChatThread {
  id: string;
  title: string;
  mode: AIMode;
  createdAt: string;
  updatedAt: string;
}

interface AIChatViewProps {
  onRequestHuman?: () => void;
}

export function AIChatView({ onRequestHuman }: AIChatViewProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>("LISTENING");
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Load threads
  const loadThreads = async () => {
    try {
      const res = await fetch("/api/ai/chats");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.chats || []);
        if (data.chats?.length > 0 && !activeThreadId) {
          setActiveThreadId(data.chats[0].id);
          setCurrentMode(data.chats[0].mode || "LISTENING");
        } else if (data.chats?.length === 0) {
          // Auto create first chat if none exists
          createNewChat();
        }
      }
    } catch (err) {
      console.error("Error loading chats:", err);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  // 2. Load messages when active thread changes
  useEffect(() => {
    if (!activeThreadId) return;
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/ai/chats/${activeThreadId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.chat?.messages || []);
          setCurrentMode(data.chat?.mode || "LISTENING");
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeThreadId]);

  // 3. Create new chat thread
  const createNewChat = async () => {
    try {
      const res = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Новый разговор", mode: currentMode }),
      });
      if (res.ok) {
        const data = await res.json();
        setThreads((prev) => [data.chat, ...prev]);
        setActiveThreadId(data.chat.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  // 4. Delete chat thread
  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeThreadId === id) {
        const remaining = threads.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
        } else {
          createNewChat();
        }
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  // 5. Rename chat
  const saveRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await fetch(`/api/ai/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: newTitle.trim() } : t))
      );
      setEditingTitleId(null);
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  };

  // 6. Change mode
  const handleModeChange = async (mode: AIMode) => {
    setCurrentMode(mode);
    if (activeThreadId) {
      fetch(`/api/ai/chats/${activeThreadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
    }
  };

  // 7. Send user message
  const handleSendMessage = async (text: string) => {
    if (!activeThreadId) return;

    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      senderType: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/ai/chats/${activeThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, mode: currentMode }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticUserMsg.id),
          data.userMessage,
          data.aiMessage,
        ]);

        if (data.safety?.riskLevel === "HIGH" || data.safety?.riskLevel === "CRITICAL") {
          setShowCrisisBanner(true);
        }
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            senderType: "SYSTEM",
            content: errData.error || "Не удалось получить ответ ИИ.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          senderType: "SYSTEM",
          content: "Ошибка сети. Пожалуйста, проверьте соединение.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-2 md:px-6 select-text">
      {/* Top Thread Controls & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-white/10 select-none">
        {/* Threads Selector */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-[65%] py-1">
          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-xs text-blue-100 transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новый диалог</span>
          </button>

          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all flex-shrink-0 border ${
                activeThreadId === thread.id
                  ? "bg-[#284580]/70 border-blue-300/40 text-white font-medium shadow-md"
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-blue-200/70"
              }`}
            >
              {editingTitleId === thread.id ? (
                <form onSubmit={(e) => saveRename(thread.id, e)} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => setEditingTitleId(null)}
                    className="bg-transparent border-b border-blue-300 text-xs text-white focus:outline-none w-24 px-1"
                  />
                </form>
              ) : (
                <span className="truncate max-w-[130px]">{thread.title}</span>
              )}

              {activeThreadId === thread.id && (
                <div className="hidden group-hover:flex items-center gap-1 ml-1 text-blue-200/60">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitleId(thread.id);
                      setNewTitle(thread.title);
                    }}
                    className="hover:text-white"
                    title="Переименовать"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => deleteChat(thread.id, e)}
                    className="hover:text-red-300"
                    title="Удалить"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-[#101e3d]/60 p-1 rounded-full border border-white/10 text-[11px]">
          <button
            onClick={() => handleModeChange("LISTENING")}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              currentMode === "LISTENING"
                ? "bg-blue-500/30 text-white font-medium"
                : "text-blue-300/70 hover:text-white"
            }`}
            title="Минимум советов, максимум бережного выслушивания"
          >
            Слушание
          </button>
          <button
            onClick={() => handleModeChange("REFLECTION")}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              currentMode === "REFLECTION"
                ? "bg-blue-500/30 text-white font-medium"
                : "text-blue-300/70 hover:text-white"
            }`}
            title="Помощь в распутывании мыслей"
          >
            Осмысление
          </button>
          <button
            onClick={() => handleModeChange("ADVICE")}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              currentMode === "ADVICE"
                ? "bg-blue-500/30 text-white font-medium"
                : "text-blue-300/70 hover:text-white"
            }`}
            title="Мягкие практические варианты действий"
          >
            Совет
          </button>
        </div>
      </div>

      {/* Main Chat Scroll Container */}
      <div className="flex-1 overflow-y-auto px-1 md:px-2 py-4 space-y-4">
        {/* Header matching visual reference */}
        <div className="space-y-1 mb-6 text-left">
          <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white">
            Привет, я здесь, чтобы тебя выслушать.
          </h2>
          <p className="text-xs md:text-sm text-blue-200/80 font-light">
            Расскажи, что у тебя на душе.
          </p>
        </div>

        {/* Crisis Banner if triggered */}
        {showCrisisBanner && (
          <CrisisBanner
            onClose={() => setShowCrisisBanner(false)}
            onRequestHuman={onRequestHuman}
          />
        )}

        {/* Date Divider (matches reference design "Сегодня") */}
        <div className="flex justify-center my-6 select-none">
          <div className="px-4 py-1 rounded-full bg-[#152347]/50 border border-white/10 text-[11px] text-blue-200/70 backdrop-blur-md">
            Сегодня
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderType={msg.senderType}
            createdAt={msg.createdAt}
            contactWarning={msg.contactWarning}
          />
        ))}

        {/* AI Typing Indicator */}
        {isSending && (
          <div className="flex items-end gap-2.5 mb-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#182b52]/80 border border-blue-300/30 flex items-center justify-center text-blue-200 shadow-md">
              <EarIcon size={20} className="text-blue-100" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#142347]/75 border border-white/10 text-blue-200 text-xs flex items-center gap-2 backdrop-blur-md shadow-md">
              <span>СИНО слушает и печатает</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer */}
      <div className="pt-2 pb-2">
        <MessageComposer
          onSendMessage={handleSendMessage}
          isStreaming={isSending}
          placeholder="Напиши здесь..."
        />
      </div>
    </div>
  );
}