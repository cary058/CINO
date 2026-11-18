"use client";

import React, { useState } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const inviteToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") : null;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    if (password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          consents: ["TERMS", "PRIVACY", "AI_ACKNOWLEDGEMENT", "LIMITATIONS"],
          inviteToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось завершить регистрацию.");
        return;
      }

      window.location.href = data.user.role === "PROFESSIONAL" ? "/psychologist" : "/";
    } catch (err) {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-screen items-center justify-center p-4 bg-[#091024] text-blue-100 font-sans">
      <StarBackground />

      <div className="relative w-full max-w-md p-8 rounded-3xl bg-[#101c38]/90 border border-blue-300/20 backdrop-blur-2xl shadow-2xl z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200">
            <EarIcon size={32} glow />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">СИНО</h1>
          <p className="text-xs text-blue-200/70">Создание защищённого псевдонимного аккаунта</p>
        </div>

        {inviteToken ? (
          <div className="rounded-xl border border-purple-300/30 bg-purple-400/10 p-3 text-[11px] leading-relaxed text-purple-100">
            Это приглашение психолога. Зарегистрируйтесь на указанный адрес почты. Профиль будет ожидать проверки администратора, после неё можно будет принимать обращения.
          </div>
        ) : process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-[11px] leading-relaxed text-amber-100">
            Это общедоступная демо-версия на зарубежном сервере. Введите только вымышленный email и псевдоним; не отправляйте реальные личные сведения и истории.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-blue-200 mb-1.5 font-medium">Псевдоним (по желанию):</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/50" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как к вам обращаться в чатах?"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 mb-1.5 font-medium">Email:</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 mb-1.5 font-medium">Пароль (от 8 символов):</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-200 mb-1.5 font-medium">Повторите пароль:</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/50" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-[11px] text-blue-200 leading-relaxed">
            Вам будет автоматически сгенерирован анонимный код (например, <strong>SINO-8F42A1</strong>). Ваше реальное имя защищено.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>{isLoading ? "Регистрация..." : "Зарегистрироваться"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-blue-300/70 pt-1">
          Уже есть аккаунт?{" "}
          <a href="/login" className="text-blue-300 hover:underline font-medium">
            Войти
          </a>
        </div>
      </div>
    </main>
  );
}

