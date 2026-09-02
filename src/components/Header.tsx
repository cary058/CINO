"use client";

import React from "react";
import { User as UserIcon, Menu, Bell } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SessionUser } from "@/types";
import { EarIcon } from "./EarIcon";

interface HeaderProps {
  user: SessionUser | null;
  onOpenProfile: () => void;
  onToggleMobileNav?: () => void;
}

export function Header({ user, onOpenProfile, onToggleMobileNav }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:px-6 w-full z-20">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={onToggleMobileNav}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-blue-100 hover:bg-white/10 transition-colors"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <EarIcon size={24} className="text-blue-200" />
          <span className="font-semibold tracking-wider text-blue-100 text-sm">СИНО</span>
        </div>
      </div>

      <div className="hidden md:block">
        {/* Empty left space on desktop since sidebar handles brand */}
      </div>

      {/* Top Right Controls */}
      <div className="flex items-center gap-3">
        <ThemeSwitcher />

        {user ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1e3460]/60 hover:bg-[#284580]/80 border border-white/20 text-blue-100 backdrop-blur-md transition-all hover:scale-105"
            title={`Профиль (${user.anonymousId})`}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        ) : (
          <a
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-xs text-blue-100 backdrop-blur-md transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Войти</span>
          </a>
        )}
      </div>
    </header>
  );
}