"use client";

import React from "react";
import { MessageSquare, User, Heart, Info, Shield, Sparkles, HeartHandshake, LogOut, LayoutDashboard, Stethoscope, Compass } from "lucide-react";
import { EarIcon } from "./EarIcon";
import { SessionUser } from "@/types";
import { hasPermission } from "@/lib/rbac";

export type NavTab = "ai" | "coordinator" | "human" | "about" | "safety";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: SessionUser | null;
  onOpenProfile: () => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  user,
  onOpenProfile,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 border ${
      isActive
        ? "bg-[#254178]/65 border-blue-300/35 text-white shadow-[0_0_15px_rgba(110,165,255,0.25)]"
        : "bg-[#142345]/35 hover:bg-[#1c305c]/55 border-white/5 text-blue-100/80 hover:text-white"
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-normal transition-all duration-200 ${
      isActive
        ? "bg-white/10 text-white font-medium"
        : "text-blue-200/70 hover:text-white hover:bg-white/5"
    }`;

  const content = (
    <div className="flex flex-col justify-between h-full p-5 text-blue-100 select-none">
      {/* Top Brand Section */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-white">СИНО</h1>
            <p className="text-[11px] text-blue-200/70 font-light mt-0.5">слушаем и не осуждаем</p>
          </div>
          <div className="text-blue-200/90 -mt-1">
            <EarIcon size={44} glow />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2.5">
          <button
            onClick={() => handleTabClick("ai")}
            className={navItemClass(activeTab === "ai")}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-blue-200" />
              <span>Чат с ИИ</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          </button>

          <button
            onClick={() => handleTabClick("coordinator")}
            className={navItemClass(activeTab === "coordinator")}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-blue-200" />
              <span>Чат с направляющим</span>
            </div>
          </button>

          <button
            onClick={() => handleTabClick("human")}
            className={navItemClass(activeTab === "human")}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-blue-200" />
              <span>Чат с человеком</span>
            </div>
          </button>
        </nav>

        {/* Secondary Info Links */}
        <div className="pt-2 space-y-1 border-t border-white/10">
          <button
            onClick={() => handleTabClick("about")}
            className={subNavItemClass(activeTab === "about")}
          >
            <Info className="w-4 h-4 text-blue-300/80" />
            <span>О нас</span>
          </button>

          <button
            onClick={() => handleTabClick("safety")}
            className={subNavItemClass(activeTab === "safety")}
          >
            <Shield className="w-4 h-4 text-blue-300/80" />
            <span>Правила и безопасность</span>
          </button>

          {/* Role-specific Dashboards */}
          {user && hasPermission(user.role, "coordinator:dashboard") && (
            <a
              href="/coordinator"
              className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs text-amber-200 hover:bg-amber-500/10 transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Панель направляющего</span>
            </a>
          )}

          {user && hasPermission(user.role, "volunteer:dashboard") && (
            <a
              href="/volunteer/dashboard"
              className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs text-emerald-200 hover:bg-emerald-500/10 transition-colors"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Кабинет волонтёра</span>
            </a>
          )}

          {user && hasPermission(user.role, "professional:dashboard") && (
            <a
              href="/psychologist"
              className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs text-purple-200 hover:bg-purple-500/10 transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Кабинет психолога</span>
            </a>
          )}

          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR") && (
            <a
              href="/admin"
              className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs text-indigo-200 hover:bg-indigo-500/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Управление платформой</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 pt-4">
        {/* Supportive Quote Card (matches reference) */}
        <div className="relative p-3.5 rounded-2xl bg-[#17264a]/50 border border-white/10 backdrop-blur-md overflow-hidden">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-snug text-blue-100/90 font-light">
              Ты не один.<br />
              Мы рядом, чтобы выслушать.
            </p>
          </div>
          {/* Subtle star in bottom right of card */}
          <div className="absolute -bottom-1 -right-1 text-blue-200/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
            </svg>
          </div>
        </div>

        {/* User Status / Profile Widget */}
        {user ? (
          <div className="flex items-center justify-between px-2 pt-1 border-t border-white/10">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-xs text-white font-medium">
                {user.displayName?.charAt(0).toUpperCase() || "П"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate max-w-[120px]">{user.displayName}</p>
                <p className="text-[10px] text-blue-300/70">{user.anonymousId}</p>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-blue-300/70 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="px-1 pt-1">
            <a
              href="/login"
              className="block w-full py-2 text-center text-xs font-medium rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-100 transition-colors"
            >
              Войти в профиль
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-72 h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl bg-[#111f3d]/55 border border-white/10 backdrop-blur-xl shadow-2xl z-10">
        {content}
      </aside>

      {/* Mobile Drawer Navigation */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 h-full bg-[#0d1833] border-r border-white/10 backdrop-blur-2xl z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

