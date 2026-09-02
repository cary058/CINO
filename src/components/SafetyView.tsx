import React from "react";
import { Shield, Phone, AlertTriangle, CheckCircle, Lock, Ban } from "lucide-react";

export function SafetyView() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 md:px-6 overflow-y-auto py-4 space-y-6 text-blue-100 select-text">
      <div className="text-center space-y-2 py-4 border-b border-white/10">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Правила и безопасность</h1>
        <p className="text-xs text-blue-200/80">Ознакомьтесь с принципами нашей работы и контактами экстренных служб</p>
      </div>

      {/* Emergency Box */}
      <div className="p-5 rounded-3xl bg-blue-900/30 border border-blue-400/30 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Phone className="w-5 h-5 text-blue-300" />
          <h3 className="text-base font-bold">Экстренные горячие линии</h3>
        </div>
        <p className="text-xs text-blue-200/90 leading-relaxed">
          Если вы или ваши близкие находитесь в прямой опасности, немедленно свяжитесь с профильными государственными службами:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="font-bold text-white block text-sm">112 — Единая служба спасения</span>
            <span className="text-blue-200/70">Бесплатно по всему Казахстану, круглосуточно</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="font-bold text-white block text-sm">150 — Национальная линия доверия</span>
            <span className="text-blue-200/70">Анонимная и бесплатная психологическая помощь</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="font-bold text-white block text-sm">111 — Государственный контакт-центр</span>
            <span className="text-blue-200/70">Помощь в защите прав и кризисных ситуациях</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="font-bold text-white block text-sm">+7 (727) 376-53-00 — РНПЦПЗ</span>
            <span className="text-blue-200/70">Республиканский центр психического здоровья</span>
          </div>
        </div>
      </div>

      {/* Boundaries & Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Границы сервиса и этика общения</h3>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs leading-relaxed text-blue-200/90">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Ограничения сервиса:</span>
          </div>
          <p>• Платформа СИНО не является медицинским учреждением и не ставит диагнозы.</p>
          <p>• ИИ и волонтёры не имеют права выписывать или отменять лекарственные препараты.</p>
          <p>• Сервис не заменяет скорую медицинскую или стационарную психиатрическую помощь.</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs leading-relaxed text-blue-200/90">
          <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
            <Ban className="w-4 h-4" />
            <span>Категорически запрещено:</span>
          </div>
          <p>• Оскорбления, угрозы и разжигание вражды;</p>
          <p>• Сексуализация диалогов и домогательства;</p>
          <p>• Обмен личными контактами (номера телефонов, соцсети, Telegram);</p>
          <p>• Попытки деанонимизации собеседника.</p>
        </div>
      </div>
    </div>
  );
}