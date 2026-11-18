"use client";

import React, { useState, useEffect } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { Compass, Users, Clock, AlertTriangle, ShieldCheck, UserCheck, Stethoscope, FileText, Send, Check } from "lucide-react";

interface HumanRequest {
  id: string;
  category: string;
  priority: string;
  safetyLevel: string;
  status: string;
  reason: string;
  createdAt: string;
  user: {
    id: string;
    anonymousId: string;
    createdAt: string;
  };
  chat?: {
    id: string;
    helper?: {
      id: string;
      anonymousId: string;
      profile?: { displayName: string };
    };
  };
  internalNotes: {
    id: string;
    authorRole: string;
    content: string;
    createdAt: string;
  }[];
}

interface Volunteer {
  id: string;
  userId: string;
  maxActiveConversations: number;
  activeConversationsCount: number;
  fullName?: string;
  education?: string;
  user: {
    id: string;
    anonymousId: string;
    profile?: { displayName: string };
  };
}

interface Professional {
  id: string;
  userId: string;
  displayName: string;
  qualification: string;
  verificationStatus: string;
  availability: "AVAILABLE" | "BUSY" | "OFFLINE" | "PAUSED";
  user: {
    id: string;
    anonymousId: string;
  };
}

export default function CoordinatorPage() {
  const [requests, setRequests] = useState<HumanRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HumanRequest | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentMessageIsError, setAssignmentMessageIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/coordinator/queue");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setVolunteers(data.availableVolunteers || []);
        setProfessionals(data.professionals || []);
        if (data.requests?.length > 0 && !selectedRequest) {
          setSelectedRequest(data.requests[0]);
        }
      }
    } catch (err) {
      console.error("Error loading coordinator queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const refreshTimer = window.setInterval(loadQueue, 10000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const handleAssign = async (helperUserId: string, helperRole: "VOLUNTEER" | "PROFESSIONAL") => {
    if (!selectedRequest) return;
    if (selectedRequest.user.id === helperUserId) {
      setAssignmentMessage("Нельзя назначить человека поддержки на собственное обращение. Для проверки нужен отдельный аккаунт пользователя.");
      setAssignmentMessageIsError(true);
      return;
    }

    setIsAssigning(true);
    setAssignmentMessage("");
    try {
      const res = await fetch("/api/coordinator/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          helperUserId,
          helperRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось назначить психолога.");

      setAssignmentMessage("Психолог назначен. Обращение обновлено.");
      setAssignmentMessageIsError(false);
      await loadQueue();
    } catch (err) {
      console.error("Assign error:", err);
      setAssignmentMessage(err instanceof Error ? err.message : "Ошибка сети при назначении. Попробуйте ещё раз.");
      setAssignmentMessageIsError(true);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !noteText.trim()) return;

    try {
      const res = await fetch("/api/coordinator/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          content: noteText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest({
          ...selectedRequest,
          internalNotes: [data.note, ...selectedRequest.internalNotes],
        });
        setNoteText("");
      }
    } catch (err) {
      console.error("Error adding internal note:", err);
    }
  };

  const handleCloseCase = async () => {
    if (!selectedRequest) return;
    if (!confirm("Завершить и закрыть обращение?")) return;

    try {
      await fetch("/api/coordinator/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          closeReason: "Закрыто координатором",
        }),
      });
      loadQueue();
    } catch (err) {
      console.error("Close case error:", err);
    }
  };

  return (
    <main className="relative flex h-screen w-screen bg-[#091024] text-blue-100 font-sans overflow-hidden">
      <StarBackground />

      <div className="relative flex flex-col flex-1 h-full max-w-7xl mx-auto p-3 md:p-6 z-10 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 mb-3 rounded-3xl bg-[#101c38]/85 border border-blue-300/20 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <EarIcon size={26} glow />
              <span className="font-bold tracking-wider text-white">СИНО</span>
            </a>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-medium">
              Диспетчерская направляющего
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-blue-200">
              <Clock className="w-4 h-4 text-sky-300" />
              <span>В очереди: <strong className="text-white font-bold">{requests.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-200">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Доступно волонтёров: <strong className="text-emerald-300 font-bold">{volunteers.length}</strong></span>
            </div>
            <a
              href="/"
              className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
            >
              ← Главная
            </a>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {/* Left: Triage Queue */}
          <div className="p-4 rounded-3xl bg-[#101c38]/75 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Очередь обращений</span>
              <span className="text-xs text-blue-300/60 font-normal">{requests.length} всего</span>
            </h3>

            {requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-xs text-blue-200/70 space-y-2">
                <Check className="w-8 h-8 text-emerald-400 opacity-60 mb-1" />
                <p>Все обращения обработаны.</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedRequest?.id === req.id
                        ? "bg-[#254178]/80 border-blue-300/40 text-white shadow-md"
                        : "bg-white/5 hover:bg-white/10 border-white/5 text-blue-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-sky-200">{req.user.anonymousId}</span>
                      <div className="flex gap-1">
                        {req.priority === "HIGH" || req.priority === "CRITICAL" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 font-bold">
                            {req.priority}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                            {req.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-blue-200/90 truncate mb-1">{req.reason || "Запрос поддержки"}</p>
                    <div className="flex items-center justify-between text-[10px] text-blue-300/60">
                      <span>Категория: {req.category}</span>
                      <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <section className="mt-4 pt-4 border-t border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white">Статус психологов</h4>
                <span className="text-[10px] text-blue-200/50">обновляется автоматически</span>
              </div>
              {professionals.length === 0 ? (
                <p className="text-[11px] text-blue-300/50">Пока нет подключённых психологов.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {professionals.map((pro) => (
                    <div key={pro.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-2">
                      <span className="text-[11px] text-blue-100 truncate">{pro.displayName}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                        pro.availability === "AVAILABLE"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : pro.availability === "BUSY"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-white/10 text-blue-200/60"
                      }`}>
                        {pro.verificationStatus === "DEMO_VERIFIED" ? "Демо · " : ""}
                        {pro.verificationStatus === "PENDING" ? "На проверке · " : ""}
                        {pro.availability === "AVAILABLE" ? "Свободен" : pro.availability === "BUSY" ? "Занят" : pro.availability === "PAUSED" ? "Пауза" : "Не на смене"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right: Triaging & Assignment Center */}
          <div className="md:col-span-2 flex flex-col rounded-3xl bg-[#111f3f]/80 border border-white/10 backdrop-blur-xl shadow-xl p-5 overflow-hidden">
            {selectedRequest ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-5">
                {/* Top Request Summary Card */}
                <div className="space-y-3 pb-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Карточка обращения: {selectedRequest.user.anonymousId}</span>
                      </h4>
                      <p className="text-xs text-blue-300/70">
                        Создано: {new Date(selectedRequest.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseCase}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs text-red-200 font-medium transition-colors"
                    >
                      Закрыть обращение
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-xs">
                    <span className="text-blue-300/70 block">Описание пользователя:</span>
                    <p className="text-white font-medium text-sm leading-relaxed">{selectedRequest.reason || "—"}</p>
                  </div>
                </div>

                {/* Assignment Box: Available Helpers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Назначить человека поддержки
                  </h4>

                  {assignmentMessage && (
                    <p role="status" className={`rounded-xl px-3 py-2 text-xs ${assignmentMessageIsError ? "bg-amber-500/10 text-amber-200" : "bg-emerald-500/10 text-emerald-200"}`}>
                      {assignmentMessage}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Volunteers Section */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-[#142347]/60 border border-white/10 text-xs">
                      <div className="flex items-center gap-1.5 text-sky-300 font-semibold mb-1">
                        <UserCheck className="w-4 h-4" />
                        <span>Доступные волонтёры ({volunteers.length})</span>
                      </div>

                      {volunteers.length === 0 ? (
                        <p className="text-blue-300/50 py-2">Нет свободных волонтёров онлайн.</p>
                      ) : (
                        <div className="space-y-2">
                          {volunteers.map((vol) => (
                            <div key={vol.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                              <div>
                                <span className="font-bold text-white block">{vol.user.profile?.displayName || vol.fullName || "Волонтёр"}</span>
                                <span className="text-[10px] text-blue-200/70">
                                  Нагрузка: {vol.activeConversationsCount} / {vol.maxActiveConversations}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAssign(vol.userId, "VOLUNTEER")}
                                disabled={isAssigning}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
                              >
                                Назначить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verified Professionals Section */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-[#142347]/60 border border-white/10 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-1">
                        <Stethoscope className="w-4 h-4" />
                        <span>Психологи ({professionals.length})</span>
                      </div>

                      {professionals.length === 0 ? (
                        <p className="text-blue-300/50 py-2">Пока нет подключённых психологов.</p>
                      ) : (
                        <div className="space-y-2">
                          {professionals.map((pro) => (
                            <div key={pro.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                              <div>
                                <span className="font-bold text-white block">{pro.displayName}</span>
                                <span className="text-[10px] text-purple-200/70 truncate max-w-[140px] block">{pro.qualification}</span>
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] ${
                                  pro.availability === "AVAILABLE"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : pro.availability === "BUSY"
                                      ? "bg-amber-500/15 text-amber-300"
                                      : "bg-white/10 text-blue-200/60"
                                }`}>
                                  {pro.verificationStatus === "DEMO_VERIFIED" ? "Демо · " : ""}
                                  {pro.verificationStatus === "PENDING" ? "На проверке · " : ""}
                                  {pro.availability === "AVAILABLE" ? "Свободен" : pro.availability === "BUSY" ? "Занят" : pro.availability === "PAUSED" ? "Пауза" : "Не на смене"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAssign(pro.userId, "PROFESSIONAL")}
                                disabled={isAssigning || pro.availability !== "AVAILABLE" || !["VERIFIED", "DEMO_VERIFIED"].includes(pro.verificationStatus)}
                                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-colors"
                              >
                                {! ["VERIFIED", "DEMO_VERIFIED"].includes(pro.verificationStatus) ? "Ожидает проверки" : pro.availability === "AVAILABLE" ? "Назначить" : pro.availability === "BUSY" ? "Психолог занят" : "Не на смене"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Internal Notes (Requirement 21: Never shown to user, audit logged) */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <FileText className="w-4 h-4" />
                    <span>Внутренние заметки направляющих (строго конфиденциально)</span>
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Добавить внутреннюю служебную заметку..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      disabled={!noteText.trim()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Сохранить</span>
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedRequest.internalNotes.map((note) => (
                      <div key={note.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] leading-relaxed">
                        <span className="text-amber-300/80 font-medium">[{note.authorRole}]: </span>
                        <span className="text-blue-100">{note.content}</span>
                        <span className="text-blue-300/40 text-[10px] ml-2">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-blue-200/70 space-y-2">
                <Compass className="w-12 h-12 opacity-30" />
                <p>Выберите обращение из очереди слева для распределения.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

