import { AIProvider, AIGenerationRequest, AIGenerationResponse, AISafetyAnalysis } from "./types";
import { analyzeMessageSafety } from "./safetyLayer";
import { buildSystemPrompt } from "./promptEngine";
import { AIMode } from "@/types";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || "";
    this.model = model || process.env.AI_MODEL || "gpt-4o-mini";
    this.baseUrl = baseUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1";
  }

  async classifySafety(message: string, history: any[] = []): Promise<AISafetyAnalysis> {
    return analyzeMessageSafety(message, history);
  }

  async generateResponse(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const safety = await this.classifySafety(request.userMessage, request.history);
    const mode: AIMode = request.requestedMode || "LISTENING";

    if (safety.isCrisis && (safety.riskLevel === "CRITICAL" || safety.riskLevel === "HIGH")) {
      return {
        content: `Слышу, как тяжело и больно тебе прямо сейчас. Твоя безопасность превыше всего. Пожалуйста, не оставайся наедине с этой болью.\n\nПозвони в службу 112 или на бесплатную горячую линию доверия 150 / 111 (Казахстан). Ты также можешь запросить живого человека в СИНО.`,
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
      return {
        content: `Я рядом и слушаю тебя. Расскажи подробнее, что происходит на душе.`,
        safety,
        detectedMode: mode,
      };
    }

    const systemPrompt = buildSystemPrompt(mode, safety);
    const messages = [
      { role: "system", content: systemPrompt },
      ...request.history.slice(-6).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: request.userMessage },
    ];

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const generatedText = data?.choices?.[0]?.message?.content || "Я рядом и готов тебя выслушать.";

      return {
        content: generatedText,
        safety,
        detectedMode: mode,
      };
    } catch (err: any) {
      console.error("OpenAI provider failed, fallback to safe message:", err.message);
      return {
        content: `Я тебя внимательно слушаю. Расскажи, о чем ты сейчас думаешь?`,
        safety,
        detectedMode: mode,
      };
    }
  }
}