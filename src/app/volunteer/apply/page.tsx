"use client";

import React, { useState } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { HeartHandshake, BookOpen, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

export default function VolunteerApplyPage() {
  const [fullName, setFullName] = useState("");
  const [education, setEducation] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [languages, setLanguages] = useState("ru, kk");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          education,
          university,
          course,
          experience,
          motivation,
          languages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось отправить заявку.");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError("Ошибка сети. Пожалуйста, попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-screen bg-[#091024] text-blue-100 font-sans p-4 md:p-8 overflow-y-auto">
      <StarBackground />

      <div className="relative max-w-3xl mx-auto z-10 space-y-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <EarIcon size={28} glow />
            <span className="text-xl font-bold tracking-wider text-white">СИНО</span>
          </a>
          <a
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-blue-200 border border-white/10 transition-colors"
          >
            ← Вернуться к сервису
          </a>
        </div>

        {isSuccess ? (
          <div className="p-8 rounded-3xl bg-[#101c38]/90 border border-blue-400/30 backdrop-blur-2xl text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Заявка успешно принята!</h2>
            <p className="text-sm text-blue-200/80 max-w-md mx-auto leading-relaxed">
              Спасибо за ваше желание помогать. Теперь вам открыт доступ к обязательному обучающему курсу (10 модулей) по этике и активному слушанию СИНО.
            </p>
            <div className="pt-4">
              <a
                href="/volunteer/training"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/30 transition-all"
              >
                <span>Перейти к обучающему курсу</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs text-blue-200 font-medium">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Программа волонтёрской поддержки</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Хочу помогать в СИНО</h1>
              <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed">
                Волонтёры СИНО — это подготовленные люди, готовые бережно выслушать человека в сложной ситуации. Мы предоставляем бесплатное обучение и супервизию.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-400/20 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-3xl bg-[#101c38]/85 border border-blue-300/20 backdrop-blur-2xl shadow-2xl space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Анкета кандидата</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200 mb-1 font-medium">ФИО / Имя:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Алексей Ким"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 mb-1 font-medium">Языки общения:</label>
                  <input
                    type="text"
                    required
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="Русский, Казахский, Английский"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-200 mb-1 font-medium">Образование / Специальность:</label>
                  <input
                    type="text"
                    required
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="Психология, педагогика, медицина или др."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-blue-200 mb-1 font-medium">Университет / Курс (при наличии):</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="КазНУ, 4 курс"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-blue-200 mb-1 font-medium">Опыт в волонтёрстве или психологической поддержке:</label>
                <textarea
                  rows={2}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Расскажите о вашем опыте (если опыта нет, напишите 'нет')..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-blue-200 mb-1 font-medium">Почему вы хотите стать волонтёром СИНО? (Мотивация):</label>
                <textarea
                  rows={3}
                  required
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Что для вас значит возможность выслушать другого человека?"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isSubmitting ? "Отправка..." : "Отправить заявку и перейти к обучению"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}