"use client";

import React, { useState } from "react";
import { User, X, Trash2, Check, ShieldAlert } from "lucide-react";
import { SessionUser } from "@/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
  onUserUpdated?: (user: SessionUser) => void;
  onLogout?: () => void;
}

export function ProfileModal({ isOpen, onClose, user, onUserUpdated, onLogout }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        if (onUserUpdated) {
          onUserUpdated({ ...user, displayName });
        }
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Delete account error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#101c38]/95 border border-blue-300/20 shadow-2xl text-blue-100 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Профиль и настройки</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-red-300">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white">Удаление профиля</h4>
            </div>
            <p className="text-blue-200/80 leading-relaxed">
              Вы уверены, что хотите удалить свой аккаунт? История ваших диалогов и сессии будут безвозвратно удалены.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-200 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Удаление..." : "Да, удалить"}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-blue-200/70 mb-1">Публичный анонимный ID:</label>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-blue-100 font-mono select-all">
                {user.anonymousId}
              </div>
              <p className="text-[10px] text-blue-300/50 mt-1">Этот ID защищает ваше настоящее имя и личные данные.</p>
            </div>

            <div>
              <label className="block text-blue-200/70 mb-1">Email аккаунта:</label>
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-blue-200/80">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-blue-200 mb-1">Псевдоним / Имя в диалогах:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как к вам обращаться?"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-blue-200/70 mb-1">Роль на платформе:</label>
              <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 font-medium text-[11px]">
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-300/70 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить профиль</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                <span>{savedSuccess ? "Сохранено" : isSaving ? "Сохранение..." : "Сохранить"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}