import React from "react";
import { CheckCheck, AlertCircle } from "lucide-react";
import { EarIcon } from "./EarIcon";

interface MessageBubbleProps {
  content: string;
  senderType: "USER" | "AI" | "COORDINATOR" | "VOLUNTEER" | "PROFESSIONAL" | "SYSTEM";
  senderName?: string;
  createdAt?: string | Date;
  contactWarning?: string;
}

export function MessageBubble({
  content,
  senderType,
  senderName,
  createdAt,
  contactWarning,
}: MessageBubbleProps) {
  const isUser = senderType === "USER";
  const isSystem = senderType === "SYSTEM";

  const timeString = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-blue-200/75 backdrop-blur-md">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Left Avatar for AI or Human Helper */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#182b52]/80 border border-blue-300/30 flex items-center justify-center text-blue-200 shadow-md">
          {senderType === "AI" ? (
            <EarIcon size={20} className="text-blue-100" />
          ) : (
            <span className="text-xs font-bold text-sky-200">
              {senderName?.charAt(0).toUpperCase() || "Ч"}
            </span>
          )}
        </div>
      )}

      {/* Message Card */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && senderName && senderType !== "AI" && (
          <span className="text-[10px] text-blue-300/70 ml-2 mb-0.5 font-medium">{senderName}</span>
        )}

        <div
          className={`px-4 py-3 rounded-2xl md:rounded-3xl backdrop-blur-md transition-all duration-200 text-sm leading-relaxed ${
            isUser
              ? "bg-[#274682]/65 hover:bg-[#2c4f94]/75 border border-blue-300/30 text-white rounded-br-sm shadow-md"
              : "bg-[#142347]/75 hover:bg-[#182b57]/85 border border-white/10 text-blue-100 rounded-bl-sm shadow-md"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>

          {/* Timestamp and Delivery check */}
          <div
            className={`flex items-center gap-1 text-[10px] mt-1 select-none ${
              isUser ? "justify-end text-blue-200/60" : "justify-start text-blue-300/50"
            }`}
          >
            <span>{timeString}</span>
            {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-300/80" />}
          </div>
        </div>

        {/* Contact Warning notification if personal contacts were detected */}
        {contactWarning && (
          <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span>{contactWarning}</span>
          </div>
        )}
      </div>
    </div>
  );
}