import React from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
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
            <Lock className="w-5 h-5 text-blue-300" />
            <h1 className="text-xl font-bold">Политика конфиденциальности сервиса «СИНО»</h1>
          </div>
          <p className="text-[11px] text-blue-300/60">Демо-версия. Действительно с 18 ноября 2026 года.</p>

          <section className="space-y-2 pt-2">
            <h2 className="text-sm font-bold text-white">1. Сбор и минимизация данных</h2>
            <p>1.1. Мы придерживаемся принципа строгой минимизации данных. Для общения на платформе не требуется раскрывать своё настоящее имя или паспортные данные.</p>
            <p>1.2. Каждому пользователю присваивается псевдонимный публичный идентификатор (например, SINO-8F42A1), защищающий приватность.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">2. Хранение и безопасность</h2>
            <p>2.1. Демо-версия размещена на платформе Render во Франкфурте, Германия. База данных демо также размещена во Франкфурте; локализация данных в Казахстане не настроена.</p>
            <p>2.2. Соединение с сайтом защищено HTTPS. Сообщения демонстрационных аккаунтов сохраняются в базе проекта и доступны только через предусмотренные роли сервиса.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">3. Обработка сообщений ИИ</h2>
            <p>3.1. Когда подключён внешний ИИ-провайдер, текст сообщения и часть истории диалога передаются ему для создания ответа. Ключ провайдера хранится на сервере и не показывается в браузере.</p>
            <p>3.2. На бесплатном тарифе Gemini Google может использовать отправленные сообщения и ответы для улучшения своих продуктов. Поэтому эта версия предназначена только для вымышленных аккаунтов и ситуаций. Не отправляйте настоящие имена, контакты, адреса или личные истории.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">4. Удаление данных</h2>
            <p>4.1. В демо-версии доступно удаление истории диалогов и аккаунта через раздел настроек профиля.</p>
          </section>
        </div>
      </div>
    </main>
  );
}