import React from "react";
import { EarIcon } from "./EarIcon";
import { Heart, Sparkles, Shield, Users } from "lucide-react";

export function AboutView() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 md:px-6 overflow-y-auto py-4 space-y-6 text-blue-100 select-text">
      <div className="text-center space-y-3 py-4 border-b border-white/10">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 shadow-xl">
          <EarIcon size={40} glow />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider">СИНО</h1>
        <p className="text-sm md:text-base text-blue-200/90 font-light">«слушаем и не осуждаем»</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-[#142345]/60 border border-white/10 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Heart className="w-5 h-5 text-rose-300" />
            <h3 className="text-base font-bold text-white">Наша философия</h3>
          </div>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            СИНО — это бесплатный сервис бережной эмоциональной поддержки. Мы верим, что в трудные моменты человеку в первую очередь нужно безопасное пространство, где его выслушают без критики, обесценивания и нравоучений.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#142345]/60 border border-white/10 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Sparkles className="w-5 h-5 text-sky-300" />
            <h3 className="text-base font-bold text-white">ИИ-собеседник</h3>
          </div>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Наш ИИ обучен принципам активного слушания. Он доступен 24/7, не устает и помогает структурировать мысли, когда необходимо выговориться прямо сейчас.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#142345]/60 border border-white/10 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Users className="w-5 h-5 text-indigo-300" />
            <h3 className="text-base font-bold text-white">Живая поддержка</h3>
          </div>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Если вам не хватает человеческого тепла или нужна квалифицированная помощь, направляющий сервиса поможет перейти в защищенный чат с обученным волонтёром или проверенным психологом.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#142345]/60 border border-white/10 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Shield className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold text-white">Конфиденциальность</h3>
          </div>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Общение происходит строго анонимно под защищенными номерами (SINO-XXXXXX). Мы не передаем ваши диалоги третьим лицам и даем возможность стереть всю историю в любой момент.
          </p>
        </div>
      </div>
    </div>
  );
}