"use client";

import React from "react";
import { Phone, HeartHandshake, X } from "lucide-react";

interface CrisisBannerProps {
  onClose?: () => void;
  onRequestHuman?: () => void;
}

export function CrisisBanner({ onClose, onRequestHuman }: CrisisBannerProps) {
  return (
    <div className="w-full p-4 mb-4 rounded-3xl bg-[#1e274a]/90 border border-blue-400/30 backdrop-blur-xl shadow-xl text-blue-100 animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <h4 className="text-sm font-semibold text-white">Мы рядом и слышим тебя</h4>
          </div>
          <p className="text-xs text-blue-200/90 leading-relaxed">
            Похоже, сейчас тебе может быть особенно тяжело или небезопасно. Давай попробуем сделать ближайшие несколько минут безопаснее:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Kazakhstan Emergency Hotline */}
            <a
              href="tel:112"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-xs text-white font-medium transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-300 flex-shrink-0" />
              <div>
                <span className="block font-bold">112 — Экстренная служба</span>
                <span className="text-[10px] text-blue-200/70">Круглосуточно, бесплатно (Казахстан)</span>
              </div>
            </a>

            {/* Helpline 150 */}
            <a
              href="tel:150"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-blue-100 font-medium transition-colors"
            >
              <Phone className="w-4 h-4 text-sky-300 flex-shrink-0" />
              <div>
                <span className="block font-bold">150 — Линия доверия</span>
                <span className="text-[10px] text-blue-200/70">Анонимная психологическая помощь</span>
              </div>
            </a>
          </div>

          {onRequestHuman && (
            <div className="pt-1">
              <button
                onClick={onRequestHuman}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Поговорить с живым человеком в СИНО</span>
              </button>
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Скрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}