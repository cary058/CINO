import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  variant?: "default" | "active" | "subtle" | "bubble";
}

export function GlassPanel({
  children,
  className,
  glow = false,
  variant = "default",
  ...props
}: GlassPanelProps) {
  const variantStyles = {
    default: "bg-[#142345]/50 hover:bg-[#182a52]/60 border-white/10 shadow-lg shadow-black/20",
    active: "bg-[#253f75]/65 border-blue-300/30 shadow-xl shadow-blue-950/40",
    subtle: "bg-[#0f1b36]/40 border-white/5",
    bubble: "bg-[#1c305c]/70 border-blue-200/20 shadow-md",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "backdrop-blur-md border rounded-3xl transition-all duration-300",
          variantStyles[variant],
          glow && "shadow-[0_0_20px_rgba(110,165,255,0.2)] border-blue-300/35",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}