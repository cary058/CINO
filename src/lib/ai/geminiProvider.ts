import { AIProvider, AIGenerationRequest, AIGenerationResponse, AISafetyAnalysis } from "./types";
import { analyzeMessageSafety } from "./safetyLayer";
import { buildSystemPrompt } from "./promptEngine";
import { AIMode } from "@/types";

export class GeminiAIProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || "";
    this.model = model || process.env.AI_MODEL || "gemini-3.8-flash";
    this.baseUrl = baseUrl || process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  }

  async classifySafety(message: string, history: any[] = []): Promise<AISafetyAnalysis> {
    return analyzeMessageSafety(message, history);
  }

  async generateResponse(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const safety = await this.classifySafety(request.userMessage, request.history);
    const mode: AIMode = request.requestedMode || "LISTENING";

    // If safety critical, return immediate safe protocol response
    if (safety.isCrisis && (safety.riskLevel === "CRITICAL" || safety.riskLevel === "HIGH")) {
      return {
        content: `Слышу, как тяжело и больно тебе прямо сейчас. Твоя безопасность превыше всего. Пожалуйста, не оставайся наедине с этой болью в ближайшие минуты.\n\nПозвони в службу экстренной помощи 112 или на бесплатную линию доверия 150 / 111 (Казахстан). Ты также можешь запросить живого человека в СИНО на соседней вкладке.`,
        safety,
        detectedMode: mode,
        crisisData: {
          emergencyNumber: "112",
          hotlineName: "Национальная линия доверия",
          hotlinePhone: "150",
        },
      };
    }

    if (!this.apiKey) {
      // Fallback if no API key is set
      return {
        content: `Я рядом и слушаю тебя. Расскажи подробнее, что происходит на душе. (AI_API_KEY не указан, работает безопасный локальный режим)`,
        safety,
        detectedMode: mode,
      };
    }

    const systemPrompt = buildSystemPrompt(mode, safety);
    const contents: any[] = [];

    for (const h of request.history.slice(-6)) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: request.userMessage }],
    });

    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const generatedText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Я здесь и слушаю тебя. Что у тебя на душе?";

      return {
        content: generatedText,
        safety,
        detectedMode: mode,
      };
    } catch (err: any) {
      console.error("Gemini provider failed, using safe fallback:", err.message);
      return {
        content: `Я внимательно тебя слушаю. Похоже, сейчас непростой период. Если захочешь, расскажи чуть больше.`,
        safety,
        detectedMode: mode,
      };
    }
  }
}