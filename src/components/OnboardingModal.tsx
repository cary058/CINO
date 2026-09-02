"use client";

import React, { useState } from "react";
import { Sparkles, Shield, HeartHandshake, CheckCircle2, ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { EarIcon } from "./EarIcon";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (consents: string[]) => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentAI, setConsentAI] = useState(false);
  const [consentLimitations, setConsentLimitations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const allConsentsChecked = consentTerms && consentPrivacy && consentAI && consentLimitations;

  const handleFinish = async () => {
    if (!allConsentsChecked) return;
    setIsSubmitting(true);
    const consents = ["TERMS", "PRIVACY", "AI_ACKNOWLEDGEMENT", "LIMITATIONS"];
    try {
      await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents }),
      });
      onComplete(consents);
    } catch (err) {
      console.error("Error submitting consents:", err);
      onComplete(consents);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 md:p-8 rounded-3xl bg-[#101c38]/95 border border-blue-300/20 shadow-2xl text-blue-100 backdrop-blur-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <EarIcon size={24} className="text-blue-300" />
            <span className="text-xs tracking-wider text-blue-200/80 font-medium uppercase">СИНО • Шаг {step} из 5</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? "w-6 bg-blue-400" : s < step ? "w-3 bg-blue-300/40" : "w-2 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 mb-4">
              <EarIcon size={36} glow />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Добро пожаловать в СИНО</h2>
            <p className="text-sm text-blue-200/90 leading-relaxed max-w-md mx-auto">
              Здесь можно выговориться, когда тебе хочется, чтобы тебя просто услышали.
            </p>
            <p className="text-xs text-blue-300/70 font-light">
              Мы создали пространство бережного внимания без критики, осуждения и непрошеных советов.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Продолжить</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: How It Works */}
        {step === 2 && (
          <div className="space-y-4 py-1">
            <h2 className="text-xl font-bold text-white mb-2">Как устроен сервис</h2>
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">1. Чат с ИИ</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed mt-0.5">
                    Доступен 24/7. Поможет выговориться, разгрузить мысли и снизить эмоциональное напряжение.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">2. Направляющий</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed mt-0.5">
                    Поможет сориентироваться и понять, какая именно человеческая помощь вам сейчас ближе.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">3. Человек поддержки</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed mt-0.5">
                    При необходимости разговор продолжается в отдельном безопасном чате с подготовленным волонтёром или психологом.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Понятно</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Important Disclaimers */}
        {step === 3 && (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Важно знать</h2>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-xs text-amber-100 space-y-2 leading-relaxed">
              <p>• <strong>ИИ — это искусственный интеллект</strong>, а не человек, не врач и не психотерапевт.</p>
              <p>• ИИ может допускать неточности и не дает медицинских диагнозов.</p>
              <p>• Сервис <strong>не заменяет экстренную медицинскую или психиатрическую помощь</strong>.</p>
              <p>• Сервис не назначает лекарственные препараты и не гарантирует абсолютную безопасность.</p>
              <p>• При прямой угрозе жизни немедленно звоните по экстренному номеру <strong>112</strong>.</p>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(4)}
                className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Я понимаю</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Plain-language Privacy */}
        {step === 4 && (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-2.5 text-blue-300">
              <Lock className="w-5 h-5" />
              <h2 className="text-xl font-bold text-white">Конфиденциальность</h2>
            </div>

            <div className="space-y-2.5 text-xs text-blue-200/90 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-0.5">Псевдонимность:</strong>
                Вам присваивается анонимный номер (например, SINO-8F42A1). Мы не требуем ваших паспортов или реальных имён.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-0.5">Защита данных:</strong>
                Сообщения шифруются. Внутренние заметки специалистов никогда не видны третьим лицам.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-0.5">Право на удаление:</strong>
                Вы в любой момент можете полностью удалить историю своих диалогов или весь профиль в настройках.
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setStep(3)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(5)}
                className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>К согласиям</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Individual Consent Checkboxes */}
        {step === 5 && (
          <div className="space-y-4 py-1">
            <h2 className="text-xl font-bold text-white">Подтверждение согласий</h2>
            <p className="text-xs text-blue-200/80">
              Пожалуйста, подтвердите каждый пункт отдельно перед началом использования сервиса:
            </p>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span className="text-xs leading-snug text-blue-100">
                  Я ознакомился(ась) с <a href="/terms" target="_blank" className="underline text-blue-300">Пользовательским соглашением</a>.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span className="text-xs leading-snug text-blue-100">
                  Я ознакомился(ась) с <a href="/privacy" target="_blank" className="underline text-blue-300">Политикой конфиденциальности</a>.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consentAI}
                  onChange={(e) => setConsentAI(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span className="text-xs leading-snug text-blue-100">
                  Я понимаю, что общаюсь с искусственным интеллектом, а не с врачом.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consentLimitations}
                  onChange={(e) => setConsentLimitations(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-transparent"
                />
                <span className="text-xs leading-snug text-blue-100">
                  Я понимаю ограничения сервиса и знаю, что в критической ситуации нужно звонить 112.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setStep(4)}
                className="w-1/3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-blue-200 transition-colors"
              >
                Назад
              </button>
              <button
                disabled={!allConsentsChecked || isSubmitting}
                onClick={handleFinish}
                className={`w-2/3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  allConsentsChecked && !isSubmitting
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? "Сохранение..." : "Я согласен(на) и продолжить"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}