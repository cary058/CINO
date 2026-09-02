"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
}

export function MessageComposer({
  onSendMessage,
  disabled = false,
  placeholder = "Напиши здесь...",
  isStreaming = false,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled || isStreaming) return;
    onSendMessage(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative w-full p-2 md:p-3 rounded-2xl md:rounded-3xl bg-[#142345]/60 hover:bg-[#182b54]/70 border border-white/10 backdrop-blur-xl shadow-xl transition-all duration-200">
      <div className="flex items-center gap-2">
        {/* Attachment icon */}
        <button
          type="button"
          onClick={() => alert("Прикрепление файлов отключено на MVP в целях максимальной приватности и безопасности.")}
          className="p-2 text-blue-200/60 hover:text-blue-100 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          title="Прикрепить файл (отключено на MVP)"
        >
          <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent border-0 text-sm md:text-base text-blue-50 placeholder-blue-300/40 focus:outline-none focus:ring-0 px-1 py-1 max-h-28 overflow-y-auto"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled || isStreaming}
          className={`p-2.5 rounded-2xl transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
            text.trim() && !disabled && !isStreaming
              ? "bg-[#3366cc] hover:bg-[#407be6] text-white shadow-lg shadow-blue-500/30 scale-100"
              : "bg-white/5 text-blue-300/30 cursor-not-allowed"
          }`}
          title="Отправить сообщение"
        >
          <Send className="w-4 h-4 md:w-4 md:h-4 text-current transform translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}