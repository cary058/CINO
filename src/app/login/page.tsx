"use client";

import React, { useState } from "react";
import { StarBackground } from "@/components/StarBackground";
import { EarIcon } from "@/components/EarIcon";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось войти.");
        return;
      }

      window.location.href = "/";
    } catch (err) {
      setError("Ошибка сети. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDevAccount = (devEmail: string) => {
    setEmail(devEmail);
    setPassword("Password123!");
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
          <p className="text-xs text-blue-200/70">Вход в защищённый профиль поддержки</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
            <label className="block text-blue-200 mb-1.5 font-medium">Пароль:</label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>{isLoading ? "Вход..." : "Войти"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Dev Login Helpers */}
        {(process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") && <div className="pt-4 border-t border-white/10 space-y-2">
          <p className="text-[11px] text-blue-300/80 font-medium">Демо-доступы для проверки ролей (пароль у всех: Password123!):</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Пользователь", email: "user@sino.kz" },
              { label: "Направляющий", email: "coordinator@sino.kz" },
              { label: "Волонтёр", email: "volunteer1@sino.kz" },
              { label: "Психолог", email: "psychologist@sino.kz" },
              { label: "Админ", email: "admin@sino.kz" },
            ].map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => fillDevAccount(d.email)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-blue-200 border border-white/5 transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>}

        <div className="text-center text-xs text-blue-300/70 pt-1">
          Нет профиля?{" "}
          <a href="/register" className="text-blue-300 hover:underline font-medium">
            Зарегистрироваться
          </a>
        </div>
      </div>
    </main>
  );
}

