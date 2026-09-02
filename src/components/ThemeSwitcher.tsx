"use client";

import React, { useState, useEffect, useRef } from "react";
import { Moon, Sun, Laptop, ChevronDown } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"night" | "day" | "system">("night");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sino_theme") as "night" | "day" | "system" | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      setTheme("night");
      applyTheme("night");
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyTheme = (mode: "night" | "day" | "system") => {
    const root = document.documentElement;
    if (mode === "night") {
      root.classList.add("dark");
    } else if (mode === "day") {
      root.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  const handleSelect = (mode: "night" | "day" | "system") => {
    setTheme(mode);
    localStorage.setItem("sino_theme", mode);
    applyTheme(mode);
    setIsOpen(false);
  };

  const labels = {
    night: { text: "Ночь", icon: <Moon className="w-3.5 h-3.5 text-blue-200" /> },
    day: { text: "День", icon: <Sun className="w-3.5 h-3.5 text-amber-300" /> },
    system: { text: "Система", icon: <Laptop className="w-3.5 h-3.5 text-sky-300" /> },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#182b52]/50 hover:bg-[#203768]/60 border border-white/15 text-xs text-blue-100 backdrop-blur-md transition-colors"
      >
        {labels[theme].icon}
        <span>{labels[theme].text}</span>
        <ChevronDown className="w-3 h-3 text-blue-300/80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 py-1 rounded-2xl bg-[#142345]/95 border border-white/15 backdrop-blur-xl shadow-xl z-50 overflow-hidden text-xs">
          <button
            onClick={() => handleSelect("night")}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-blue-100 hover:bg-white/10 transition-colors"
          >
            <Moon className="w-3.5 h-3.5 text-blue-200" />
            <span>Ночь</span>
          </button>
          <button
            onClick={() => handleSelect("day")}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-blue-100 hover:bg-white/10 transition-colors"
          >
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span>День</span>
          </button>
          <button
            onClick={() => handleSelect("system")}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-blue-100 hover:bg-white/10 transition-colors"
          >
            <Laptop className="w-3.5 h-3.5 text-sky-300" />
            <span>Системная</span>
          </button>
        </div>
      )}
    </div>
  );
}