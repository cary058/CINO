import React from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-screen bg-[#091024] text-blue-100 font-sans p-4 md:p-8 overflow-y-auto">
      <StarBackground />

      <div className="relative max-w-3xl mx-auto z-10 space-y-6 py-6 text-xs md:text-sm leading-relaxed text-blue-200/90">
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

        <div className="p-6 md:p-8 rounded-3xl bg-[#101c38]/90 border border-blue-300/20 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-blue-300" />
            <h1 className="text-xl font-bold">Пользовательское соглашение сервиса «СИНО»</h1>
          </div>
          <p className="text-[11px] text-blue-300/60">Версия документа 1.0. Действительно с 2026 года.</p>

          <section className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-white">1. Общие положения</h2>
            <p>1.1. Сервис «СИНО» («слушаем и не осуждаем») предоставляет пользователям бесплатное пространство для эмоциональной разгрузки посредством общения с искусственным интеллектом, направляющими координаторами, волонтёрами и проверенными психологами.</p>
            <p>1.2. Сервис не является медицинской организацией и не оказывает медицинских услуг.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">2. Ограничение ответственности</h2>
            <p>2.1. ИИ-помощник и волонтёры поддержки не имеют права ставить диагнозы, назначать медикаменты или гарантировать решение жизненных проблем.</p>
            <p>2.2. Сервис не заменяет экстренную медицинскую помощь. В случаях непосредственной угрозы жизни и здоровью пользователь соглашается немедленно обращаться в официальные службы по номеру 112.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">3. Правила поведения</h2>
            <p>3.1. Запрещаются любые проявления агрессии, оскорблений, угроз, сексуализации общения и попытки деанонимизации собеседников.</p>
            <p>3.2. На платформе запрещен обмен персональными контактными данными (номера телефонов, мессенджеры, соцсети).</p>
          </section>
        </div>
      </div>
    </main>
  );
}