import React from "react";

interface EarIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export function EarIcon({ className = "text-white", size = 48, glow = false }: EarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(155,197,255,0.7)]" : ""}`}
    >
      {/* Outer helix curve */}
      <path
        d="M24 10C38 10 52 18 52 36C52 48 44 58 36 64C30 68 22 70 18 66C14 62 16 54 20 50C24 46 28 42 28 36C28 26 22 22 18 22"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner antihelix curve */}
      <path
        d="M32 24C38 27 42 32 42 40C42 46 38 52 32 54"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tragus / canal notch */}
      <path
        d="M22 36C25 36 28 38 28 41C28 44 24 46 22 46"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}