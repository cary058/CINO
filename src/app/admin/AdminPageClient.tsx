"use client";

import React, { useState, useEffect } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Stethoscope,
  ShieldAlert,
  Flag,
  FileText,
  Settings,
  Mail,
  Power,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Shield
} from "lucide-react";

type AdminTab =
  | "overview"
  | "users"
  | "volunteers"
  | "professionals"
  | "safety"
  | "reports"
  | "audit"
  | "invites"
  | "settings";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [safetyEventsList, setSafetyEventsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [userSearch, setUserSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("PROFESSIONAL");
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Dashboard metrics
      const dashRes = await fetch("/api/admin/dashboard");
      if (dashRes.ok) {
        setDashboardData(await dashRes.json());
      }

      // 2. Tab-specific data
      if (tab === "users") {
        const uRes = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
        if (uRes.ok) setUsersList((await uRes.json()).users || []);
      } else if (tab === "volunteers") {
        const vRes = await fetch("/api/admin/volunteers");
        if (vRes.ok) setVolunteersList((await vRes.json()).volunteers || []);
      } else if (tab === "professionals") {
        const pRes = await fetch("/api/admin/professionals");
        if (pRes.ok) setProfessionalsList((await pRes.json()).professionals || []);
      } else if (tab === "safety") {
        const sRes = await fetch("/api/admin/safety-events");
        if (sRes.ok) setSafetyEventsList((await sRes.json()).events || []);
      } else if (tab === "reports") {
        const rRes = await fetch("/api/reports");
        if (rRes.ok) setReportsList((await rRes.json()).reports || []);
      } else if (tab === "audit") {
        const aRes = await fetch("/api/admin/audit-logs");
        if (aRes.ok) setAuditLogsList((await aRes.json()).logs || []);
      } else if (tab === "settings") {
        const setRes = await fetch("/api/admin/settings");
        if (setRes.ok) setSettingsList((await setRes.json()).settings || []);
      } else if (tab === "invites") {
        const invRes = await fetch("/api/admin/invitations");
        if (invRes.ok) setInvitationsList((await invRes.json()).invitations || []);
      }
    } catch (err) {
      console.error("Admin data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  // Kill Switch Toggle
  const toggleKillSwitch = async (target: "ENABLE_AI" | "ENABLE_HUMAN_SUPPORT", currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/kill-switches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, enabled: !currentVal }),
      });
      if (res.ok) {
        setDashboardData((prev: any) => ({
          ...prev,
          killSwitches: {
            ...prev.killSwitches,
            [target === "ENABLE_AI" ? "enableAI" : "enableHumanSupport"]: !currentVal,
          },
        }));
      }
    } catch (err) {
      console.error("Kill switch error:", err);
    }
  };

  // Volunteer Approval
  const handleVolunteerStatus = async (volunteerId: string, status: string) => {
    try {
      await fetch("/api/admin/volunteers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId, status }),
      });
      loadData();
    } catch (err) {
      console.error("Volunteer status error:", err);
    }
  };

  // Professional Verification
  const handleProfessionalStatus = async (professionalId: string, verificationStatus: string) => {
    try {
      await fetch("/api/admin/professionals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, verificationStatus }),
      });
      loadData();
    } catch (err) {
      console.error("Professional status error:", err);
    }
  };

  // User Suspension
  const handleUserStatus = async (userId: string, status: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      loadData();
    } catch (err) {
      console.error("User status error:", err);
    }
  };

  // Create Invitation
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError("");
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteResult(data.inviteLink || data.message);
        setInviteEmail("");
        loadData();
      } else {
        const data = await res.json();
        setInviteError(data.error || "Не удалось создать приглашение.");
      }
    } catch (err) {
      console.error("Invite error:", err);
      setInviteError("Ошибка сети при создании приглашения.");
    }
  };

  return (
    <main className="relative flex h-screen w-screen bg-[#091024] text-blue-100 font-sans overflow-hidden">
      <StarBackground />

      <div className="relative flex flex-col flex-1 h-full max-w-7xl mx-auto p-3 md:p-6 z-10 overflow-hidden">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 p-4 mb-3 rounded-3xl bg-[#101c38]/85 border border-indigo-400/20 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <EarIcon size={26} glow />
              <span className="font-bold tracking-wider text-white">СИНО</span>
            </a>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Панель управления (Admin)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
            >
              ← Главная
            </a>
          </div>
        </header>

        {/* Admin Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 text-xs select-none">
          {[
            { id: "overview", label: "Обзор", icon: LayoutDashboard },
            { id: "users", label: "Пользователи", icon: Users },
            { id: "volunteers", label: "Волонтёры", icon: HeartHandshake },
            { id: "professionals", label: "Психологи", icon: Stethoscope },
            { id: "safety", label: "Безопасность", icon: ShieldAlert },
            { id: "reports", label: "Жалобы", icon: Flag },
            { id: "audit", label: "Журнал аудита", icon: FileText },
            { id: "invites", label: "Приглашения", icon: Mail },
            { id: "settings", label: "Настройки", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl whitespace-nowrap transition-all border ${
                  tab === item.id
                    ? "bg-indigo-600 border-indigo-400 text-white font-semibold shadow-md shadow-indigo-600/30"
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-blue-200/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 rounded-3xl bg-[#111f3f]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
          {/* 1. OVERVIEW TAB */}
          {tab === "overview" && dashboardData && (
            <div className="space-y-6">
              {/* Emergency Kill Switches */}
              <div className="p-4 rounded-2xl bg-[#17254a]/70 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Power className="w-4 h-4 text-amber-300" />
                    <span>Главные выключатели (Kill Switches)</span>
                  </h4>
                  <p className="text-xs text-blue-200/70 mt-0.5">
                    Позволяют мгновенно приостановить работу ИИ или поддержки людей в экстренных ситуациях.
                  </p>
                </div>

                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => toggleKillSwitch("ENABLE_AI", dashboardData.killSwitches.enableAI)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                      dashboardData.killSwitches.enableAI
                        ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                        : "bg-red-600/30 border-red-400 text-red-200 font-bold"
                    }`}
                  >
                    <span>ИИ-чат: {dashboardData.killSwitches.enableAI ? "ВКЛЮЧЁН" : "ОТКЛЮЧЁН"}</span>
                  </button>

                  <button
                    onClick={() => toggleKillSwitch("ENABLE_HUMAN_SUPPORT", dashboardData.killSwitches.enableHumanSupport)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                      dashboardData.killSwitches.enableHumanSupport
                        ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                        : "bg-red-600/30 border-red-400 text-red-200 font-bold"
                    }`}
                  >
                    <span>Поддержка людей: {dashboardData.killSwitches.enableHumanSupport ? "ВКЛЮЧЕНА" : "ОТКЛЮЧЕНА"}</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Пользователи</span>
                  <div className="text-2xl font-bold text-white">{dashboardData.metrics.totalUsers}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">ИИ-диалоги</span>
                  <div className="text-2xl font-bold text-sky-300">{dashboardData.metrics.totalAIChats}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Обращения к людям</span>
                  <div className="text-2xl font-bold text-indigo-300">{dashboardData.metrics.totalHumanRequests}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">В очереди сейчас</span>
                  <div className="text-2xl font-bold text-amber-300">{dashboardData.metrics.waitingRequests}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Волонтёры онлайн</span>
                  <div className="text-2xl font-bold text-emerald-300">{dashboardData.metrics.availableVolunteers}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Психологи онлайн</span>
                  <div className="text-2xl font-bold text-purple-300">{dashboardData.metrics.availableProfessionals}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Открытые жалобы</span>
                  <div className="text-2xl font-bold text-red-300">{dashboardData.metrics.openReports}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-blue-300/70">Инциденты риска</span>
                  <div className="text-2xl font-bold text-rose-400">{dashboardData.metrics.criticalSafetyEvents}</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS TAB */}
          {tab === "users" && (
            <div className="space-y-4 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Поиск по email или анонимному ID (например SINO-8F42A1)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={loadData}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Найти</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-blue-300/70 pb-2">
                      <th className="py-2">Анонимный ID</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5">
                        <td className="py-2.5 font-mono text-sky-200">{u.anonymousId}</td>
                        <td className="text-white">{u.email}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">{u.role}</span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-md ${u.status === "ACTIVE" ? "text-emerald-300 bg-emerald-500/20" : "text-red-300 bg-red-500/20"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          {u.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleUserStatus(u.id, "SUSPENDED")}
                              className="text-red-300 hover:underline"
                            >
                              Заблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserStatus(u.id, "ACTIVE")}
                              className="text-emerald-300 hover:underline"
                            >
                              Разблокировать
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. VOLUNTEERS TAB */}
          {tab === "volunteers" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Кандидаты и волонтёры платформы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {volunteersList.map((vol) => (
                  <div key={vol.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{vol.fullName || vol.user?.profile?.displayName || "Волонтёр"}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 font-mono text-[11px]">
                        {vol.status}
                      </span>
                    </div>
                    <p className="text-blue-200/80"><strong>Образование:</strong> {vol.education || "Не указано"}</p>
                    <p className="text-blue-200/80"><strong>Мотивация:</strong> {vol.motivation || "—"}</p>
                    <p className="text-sky-300">
                      <strong>Обучение:</strong> {vol.user?.volunteerProgress?.[0]?.completedModules || 0} / 10 модулей
                    </p>

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      {vol.status !== "APPROVED" && (
                        <button
                          onClick={() => handleVolunteerStatus(vol.id, "APPROVED")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          Одобрить волонтёра
                        </button>
                      )}
                      {vol.status !== "REJECTED" && (
                        <button
                          onClick={() => handleVolunteerStatus(vol.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-xl bg-red-600/60 hover:bg-red-600 text-white font-semibold"
                        >
                          Отклонить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PROFESSIONALS TAB */}
          {tab === "professionals" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Верификация специалистов-психологов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {professionalsList.map((pro) => (
                  <div key={pro.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{pro.displayName}</h4>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] ${
                        pro.verificationStatus === "VERIFIED" ? "bg-purple-500/20 text-purple-200" : "bg-amber-500/20 text-amber-200"
                      }`}>
                        {pro.verificationStatus}
                      </span>
                    </div>
                    <p className="text-blue-200/80"><strong>Образование:</strong> {pro.education}</p>
                    <p className="text-blue-200/80"><strong>Квалификация:</strong> {pro.qualification}</p>
                    <p className="text-blue-200/80"><strong>Специализации:</strong> {pro.specializations || "Общие"}</p>

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      {pro.verificationStatus !== "VERIFIED" && (
                        <button
                          onClick={() => handleProfessionalStatus(pro.id, "VERIFIED")}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                        >
                          Подтвердить квалификацию
                        </button>
                      )}
                      {pro.verificationStatus !== "REJECTED" && (
                        <button
                          onClick={() => handleProfessionalStatus(pro.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-xl bg-red-600/60 hover:bg-red-600 text-white font-semibold"
                        >
                          Отклонить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SAFETY EVENTS TAB */}
          {tab === "safety" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Журнал инцидентов безопасности</h3>
              <div className="space-y-2">
                {safetyEventsList.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.riskLevel === "CRITICAL" ? "bg-red-500/30 text-red-200" : "bg-amber-500/30 text-amber-200"
                        }`}>
                          {ev.riskLevel}
                        </span>
                        <span className="font-semibold text-white">{ev.category}</span>
                        <span className="text-blue-300/60 font-mono">({ev.user?.anonymousId})</span>
                      </div>
                      <p className="text-blue-200/70">{ev.actionTaken || "Действие не зафиксировано"}</p>
                    </div>
                    <span className="text-[10px] text-blue-300/50">{new Date(ev.createdAt).toLocaleString("ru-RU")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. REPORTS TAB */}
          {tab === "reports" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Жалобы пользователей и модерация</h3>
              <div className="space-y-2">
                {reportsList.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-300">{rep.reason}</span>
                        <span className="text-blue-300/60">от {rep.reporter?.anonymousId}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono">{rep.status}</span>
                    </div>
                    <p className="text-white text-xs leading-relaxed">{rep.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. AUDIT LOGS TAB */}
          {tab === "audit" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Неизменяемый журнал безопасности (Audit Log)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-blue-300/70 pb-2">
                      <th className="py-2">Время</th>
                      <th>Действие</th>
                      <th>Пользователь</th>
                      <th>Объект</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="py-2 text-[11px] text-blue-300/60">{new Date(log.createdAt).toLocaleString("ru-RU")}</td>
                        <td className="font-mono text-sky-200 font-semibold">{log.action}</td>
                        <td className="text-white">{log.actor?.anonymousId || "Гость / Система"}</td>
                        <td className="text-blue-200/70">{log.targetType || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. INVITATIONS TAB */}
          {tab === "invites" && (
            <div className="space-y-6 text-xs">
              <form onSubmit={handleCreateInvite} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 max-w-lg">
                <h4 className="text-sm font-bold text-white">Создать одноразовое приглашение для роли</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-blue-200 mb-1">Email кандидата:</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="specialist@sino.kz"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-1">Назначаемая роль:</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
                      className="w-full px-3 py-2 rounded-xl bg-[#101c38] border border-white/10 text-white focus:outline-none focus:border-blue-400 disabled:opacity-70"
                    >
                      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
                        <option value="PROFESSIONAL">Психолог</option>
                      ) : (
                        <>
                          <option value="COORDINATOR">COORDINATOR (Направляющий)</option>
                          <option value="VOLUNTEER">VOLUNTEER (Волонтёр)</option>
                          <option value="PROFESSIONAL">PROFESSIONAL (Психолог)</option>
                          <option value="MODERATOR">MODERATOR (Модератор)</option>
                          <option value="ADMIN">ADMIN (Администратор)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
                >
                  Сгенерировать приглашение
                </button>
              </form>

              <p className="max-w-lg text-[11px] text-blue-200/60">Ссылка не отправляется автоматически: её нужно передать приглашённому человеку. Профиль психолога сначала будет проверен.</p>
              {inviteError && <p role="alert" className="max-w-lg text-xs text-amber-200">{inviteError}</p>}

              {inviteResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 select-all">
                  <strong>{inviteResult.startsWith("http") ? "Одноразовая ссылка для регистрации:" : "Роль психолога назначена существующему аккаунту:"}</strong>
                  <p className="mt-1 font-mono text-xs">{inviteResult}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Созданные приглашения</h4>
                {invitationsList.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{inv.email}</span>
                      <span className="text-blue-300/60 ml-2">[{inv.role}]</span>
                    </div>
                    <span className="text-[10px] text-blue-300/50">Истекает: {new Date(inv.expiresAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SETTINGS TAB */}
          {tab === "settings" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Глобальные параметры платформы</h3>
              <div className="space-y-3 max-w-2xl">
                {settingsList.map((st) => (
                  <div key={st.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block font-mono">{st.key}</span>
                      <span className="text-blue-200/70 text-[11px]">{st.description || "Системный параметр"}</span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-200 font-mono font-bold">
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

