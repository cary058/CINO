"use client";

import React, { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function StarBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Generate small background star particles
    const starCount = 65;
    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 3,
      });
    }
    setStars(newStars);

    // Generate larger glowing 4-point accent sparkles (matching reference design)
    const newSparkles: Sparkle[] = [
      { id: 1, x: 12, y: 18, size: 14, opacity: 0.8 },
      { id: 2, x: 21, y: 28, size: 18, opacity: 0.9 },
      { id: 3, x: 31, y: 8, size: 12, opacity: 0.75 },
      { id: 4, x: 48, y: 35, size: 10, opacity: 0.6 },
      { id: 5, x: 75, y: 8, size: 16, opacity: 0.85 },
      { id: 6, x: 82, y: 22, size: 14, opacity: 0.7 },
      { id: 7, x: 92, y: 53, size: 20, opacity: 0.95 },
      { id: 8, x: 78, y: 82, size: 16, opacity: 0.85 },
      { id: 9, x: 18, y: 80, size: 15, opacity: 0.8 },
      { id: 10, x: 5, y: 92, size: 12, opacity: 0.65 },
    ];
    setSparkles(newSparkles);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Deep Night Sky Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091024] via-[#0d1733] to-[#121f45] dark:from-[#080e20] dark:via-[#0c1631] dark:to-[#101b3e] transition-colors duration-700" />

      {/* Gentle Nebular Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-[90px]" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] rounded-full bg-sky-600/10 blur-[130px]" />

      {/* Subtle Shooting Star Accent */}
      <div
        className="absolute top-1/4 right-1/3 w-32 h-[1.5px] bg-gradient-to-r from-transparent via-blue-200 to-transparent -rotate-[35deg] animate-shooting opacity-40"
        style={{ animationDuration: "8s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-2/3 right-1/4 w-40 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-100 to-transparent -rotate-[35deg] animate-shooting opacity-30"
        style={{ animationDuration: "12s", animationDelay: "7s" }}
      />

      {/* Twinkling Star Points */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: `${s.y}%`,
            left: `${s.x}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Glowing 4-Point Stars (as seen in the reference visual) */}
      {sparkles.map((sp) => (
        <div
          key={`sparkle-${sp.id}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulseGlow text-blue-100/90"
          style={{
            top: `${sp.y}%`,
            left: `${sp.x}%`,
            width: `${sp.size}px`,
            height: `${sp.size}px`,
            opacity: sp.opacity,
            animationDuration: "4.5s",
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_8px_rgba(195,225,255,0.85)]">
            <path d="M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8L12 0Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}