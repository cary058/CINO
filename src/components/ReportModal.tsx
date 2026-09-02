"use client";

import React, { useState } from "react";
import { Flag, X, Send } from "lucide-react";
import { ReportReason } from "@/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  conversationId?: string;
}

export function ReportModal({ isOpen, onClose, reportedUserId, conversationId }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("OFFENSE");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reasonsList: { value: ReportReason; label: string }[] = [
    { value: "OFFENSE", label: "Оскорбления или грубость" },
    { value: "THREAT", label: "Угрозы или запугивание" },
    { value: "SEXUAL", label: "Сексуальное поведение или домогательства" },
    { value: "BOUNDARIES", label: "Нарушение личных границ" },
    { value: "HARMFUL_ADVICE", label: "Опасные или вредные медицинские советы" },
    { value: "PRIVACY_BREACH", label: "Попытка выведать персональные контакты" },
    { value: "FRAUD", label: "Мошенничество или вымогательство" },
    { value: "OTHER", label: "Другое нарушение" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          conversationId,
          reason,
          description: description.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-red-400/20 shadow-2xl text-blue-100 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-red-300">
            <Flag className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Оформить жалобу</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <h4 className="text-sm font-semibold text-white">Жалоба успешно отправлена</h4>
            <p className="text-xs text-blue-200/70">Модераторы рассмотрят обращение в приоритетном порядке.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-blue-200 mb-1.5 font-medium">Причина жалобы:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400"
              >
                {reasonsList.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#101c38] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-blue-200 mb-1.5 font-medium">Опишите, что произошло:</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Пожалуйста, уточните детали нарушения..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!description.trim() || isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Отправка..." : "Отправить жалобу"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}