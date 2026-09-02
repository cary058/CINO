import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sino: {
          bg: {
            night: "#0a1128",
            night2: "#0e1834",
            night3: "#142247",
            light: "#edf2fa",
            light2: "#e2ebf7",
          },
          panel: {
            night: "rgba(20, 35, 68, 0.45)",
            nightHover: "rgba(30, 50, 95, 0.65)",
            nightActive: "rgba(45, 75, 135, 0.7)",
            light: "rgba(255, 255, 255, 0.72)",
            lightHover: "rgba(255, 255, 255, 0.9)",
          },
          border: {
            night: "rgba(147, 197, 253, 0.18)",
            nightGlow: "rgba(165, 210, 255, 0.35)",
            light: "rgba(180, 205, 240, 0.5)",
          },
          bubble: {
            userNight: "rgba(45, 75, 135, 0.55)",
            userBorderNight: "rgba(125, 175, 255, 0.3)",
            aiNight: "rgba(20, 36, 70, 0.65)",
            aiBorderNight: "rgba(120, 160, 220, 0.2)",
            userLight: "rgba(75, 120, 210, 0.85)",
            aiLight: "rgba(255, 255, 255, 0.9)",
          },
          accent: {
            DEFAULT: "#70a7ff",
            soft: "#9bc4ff",
            glow: "#cce0ff",
            dark: "#3d7cd4",
          },
          text: {
            night: "#f0f6ff",
            nightMuted: "#94abd0",
            nightDim: "#627d9f",
            light: "#1c2b44",
            lightMuted: "#536987",
            lightDim: "#879cb5",
          }
        }
      },
      backdropBlur: {
        xs: "2px",
        md: "12px",
        lg: "20px",
        xl: "32px",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        shooting: {
          "0%": { transform: "translateX(0) translateY(0) rotate(-45deg)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "translateX(280px) translateY(280px) rotate(-45deg)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        }
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        twinkleFast: "twinkle 2.5s ease-in-out infinite",
        twinkleSlow: "twinkle 6s ease-in-out infinite",
        shooting: "shooting 3s ease-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        float: "floatSlow 4s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
export default config;
