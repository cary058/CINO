"use client";

import React, { useState } from "react";
import { ShieldCheck, Check } from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel?: () => void;
}

export function RulesModal({ isOpen, onAccept, onCancel }: RulesModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen) return null;

  const handleAgree = async () => {
    setIsAccepting(true);
    try {
      await fetch("/api/human/rules-accept", { method: "POST" });
      onAccept();
    } catch {
      onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-blue-300/25 shadow-2xl text-blue-100 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Перед началом разговора</h3>
        </div>

        <div className="space-y-3 text-xs text-blue-200/90 leading-relaxed mb-6">
          <p className="font-medium text-white">
            Здесь с тобой будет разговаривать живой человек.
          </p>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <p>• Не оскорбляй собеседника;</p>
            <p>• Не угрожай;</p>
            <p>• Не отправляй сексуальный или шокирующий контент;</p>
            <p>• Не пытайся получить личные данные (телефон, Telegram, соцсети);</p>
            <p>• Уважай личные границы.</p>
          </div>
          <p className="text-[11px] text-blue-300/70">
            Человек по другую сторону экрана также обязан соблюдать этику и имеет право завершить разговор или передать обращение при нарушении правил.
          </p>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
            >
              Отмена
            </button>
          )}
          <button
            onClick={handleAgree}
            disabled={isAccepting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isAccepting ? "Сохранение..." : "Я согласен(на) с правилами"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}