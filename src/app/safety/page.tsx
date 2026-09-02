import React from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { SafetyView } from "@/components/SafetyView";

export default function SafetyPage() {
  return (
    <main className="relative min-h-screen w-screen bg-[#091024] text-blue-100 font-sans p-4 md:p-8 overflow-y-auto">
      <StarBackground />

      <div className="relative max-w-4xl mx-auto z-10 space-y-6 py-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <EarIcon size={28} glow />
            <span className="text-xl font-bold tracking-wider text-white">СИНО</span>
          </a>
          <a
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-blue-200 border border-white/10 transition-colors"
          >
            ← Главная
          </a>
        </div>

        <SafetyView />
      </div>
    </main>
  );
}