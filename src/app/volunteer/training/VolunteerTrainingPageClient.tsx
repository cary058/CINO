"use client";

import React, { useState, useEffect } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { BookOpen, CheckCircle2, Lock, ArrowRight, Check, AlertCircle, HelpCircle } from "lucide-react";

interface ModuleData {
  id: string;
  order: number;
  title: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
  };
  isCompleted: boolean;
}

export default function VolunteerTrainingPage() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{ passed?: boolean; message?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ completedModules: number; totalModules: number; trainingCompleted: boolean } | null>(null);

  const loadTraining = async () => {
    try {
      const res = await fetch("/api/volunteer/training");
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
        setProgress(data.progress || null);

        // Auto select first uncompleted module
        const firstUnfinished = (data.modules || []).findIndex((m: ModuleData) => !m.isCompleted);
        if (firstUnfinished !== -1) {
          setActiveModuleIndex(firstUnfinished);
        }
      }
    } catch (err) {
      console.error("Error loading training modules:", err);
    }
  };

  useEffect(() => {
    loadTraining();
  }, []);

  const currentMod = modules[activeModuleIndex];

  const handleQuizSubmit = async () => {
    if (selectedOption === null || !currentMod) return;

    setIsSubmitting(true);
    setQuizResult(null);

    try {
      const res = await fetch("/api/volunteer/training/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: currentMod.id,
          selectedIndex: selectedOption,
        }),
      });

      const data = await res.json();
      setQuizResult({ passed: data.passed, message: data.message });

      if (data.passed) {
        setModules((prev) =>
          prev.map((m, idx) => (idx === activeModuleIndex ? { ...m, isCompleted: true } : m))
        );
        if (progress) {
          setProgress({
            ...progress,
            completedModules: data.completedModules,
            trainingCompleted: data.trainingCompleted,
          });
        }
      }
    } catch (err) {
      setQuizResult({ passed: false, message: "Ошибка при отправке ответа." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-screen bg-[#091024] text-blue-100 font-sans p-4 md:p-8 overflow-y-auto">
      <StarBackground />

      <div className="relative max-w-5xl mx-auto z-10 space-y-6 py-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <EarIcon size={28} glow />
            <span className="text-xl font-bold tracking-wider text-white">СИНО</span>
          </a>
          <a
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-blue-200 border border-white/10 transition-colors"
          >
            ← В главное меню
          </a>
        </div>

        {/* Progress Overview Bar */}
        <div className="p-5 rounded-3xl bg-[#101c38]/90 border border-blue-300/20 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <BookOpen className="w-5 h-5 text-blue-300" />
              <span>Обучение волонтёра поддержки СИНО</span>
            </h2>
            <p className="text-xs text-blue-200/80">
              Пройдите 10 обязательных модулей и ответьте на контрольные вопросы для допуска к дежурствам.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-blue-200 font-medium">Прогресс: </span>
              <span className="text-sm font-bold text-sky-300">
                {progress?.completedModules || 0} / 10 модулей
              </span>
            </div>
            {progress?.trainingCompleted && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                Курс завершён
              </span>
            )}
          </div>
        </div>

        {/* Module Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 select-none">
          {modules.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveModuleIndex(idx);
                setSelectedOption(null);
                setQuizResult(null);
              }}
              className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                activeModuleIndex === idx
                  ? "bg-blue-600 border-blue-300 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : m.isCompleted
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/50"
                  : "bg-white/5 border-white/10 text-blue-200/70 hover:bg-white/10"
              }`}
            >
              <span>{idx + 1}</span>
              {m.isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-blue-300/40">•</span>
              )}
            </button>
          ))}
        </div>

        {/* Current Module Content & Quiz */}
        {currentMod && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Theory Lecture (2 columns) */}
            <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-[#101c38]/85 border border-blue-300/20 backdrop-blur-2xl shadow-xl space-y-4 text-xs leading-relaxed text-blue-100">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base md:text-lg font-bold text-white">{currentMod.title}</h3>
                {currentMod.isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-300 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Пройден</span>
                  </span>
                )}
              </div>

              <div className="whitespace-pre-wrap font-sans text-xs md:text-sm text-blue-100/90 leading-relaxed">
                {currentMod.content}
              </div>
            </div>

            {/* Interactive Test Quiz (1 column) */}
            <div className="p-6 rounded-3xl bg-[#142347]/85 border border-blue-300/20 backdrop-blur-2xl shadow-xl space-y-4 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>Контрольный вопрос</span>
                </div>
                <p className="text-white font-medium leading-snug">
                  {currentMod.quiz?.question}
                </p>

                <div className="space-y-2 pt-2">
                  {currentMod.quiz?.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => setSelectedOption(oIdx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs leading-relaxed ${
                        selectedOption === oIdx
                          ? "bg-blue-600/40 border-blue-400 text-white font-medium shadow-md"
                          : "bg-white/5 border-white/10 text-blue-200/80 hover:bg-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {quizResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      quizResult.passed
                        ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
                        : "bg-red-500/10 border-red-400/30 text-red-200"
                    }`}
                  >
                    {quizResult.message}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={selectedOption === null || isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? "Проверка..." : "Проверить ответ"}</span>
                </button>

                {activeModuleIndex < modules.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModuleIndex(activeModuleIndex + 1);
                      setSelectedOption(null);
                      setQuizResult(null);
                    }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Следующий модуль</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
