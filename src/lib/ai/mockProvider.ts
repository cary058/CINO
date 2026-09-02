import { AIProvider, AIGenerationRequest, AIGenerationResponse, AISafetyAnalysis } from "./types";
import { analyzeMessageSafety } from "./safetyLayer";
import { AIMode } from "@/types";

export class MockAIProvider implements AIProvider {
  name = "mock";

  async classifySafety(message: string, history: any[] = []): Promise<AISafetyAnalysis> {
    return analyzeMessageSafety(message, history);
  }

  async generateResponse(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const safety = await this.classifySafety(request.userMessage, request.history);
    const text = request.userMessage.toLowerCase().trim();

    // Determine Mode
    let detectedMode: AIMode = request.requestedMode || "LISTENING";
    if (text.includes("просто послушай") || text.includes("не давай советов") || text.includes("выслушай")) {
      detectedMode = "LISTENING";
    } else if (text.includes("что мне делать") || text.includes("дай совет") || text.includes("как поступить") || text.includes("посоветуй")) {
      detectedMode = "ADVICE";
    } else if (text.includes("помоги разобраться") || text.includes("не понимаю себя") || text.includes("почему я так")) {
      detectedMode = "REFLECTION";
    }

    // 1. Critical Crisis Intervention
    if (safety.isCrisis && (safety.riskLevel === "CRITICAL" || safety.riskLevel === "HIGH")) {
      return {
        content: `Слышу, как невыносимо тяжело и больно тебе прямо сейчас. Твоя безопасность превыше всего. Пожалуйста, не оставайся наедине с этой болью в ближайшие минуты.\n\nЕсли ты чувствуешь прямую угрозу своей жизни, позвони в экстренную службу 112 (Казахстан) или на бесплатную круглосуточную линию доверия 150 / 111. Ты также можешь запросить живого человека в СИНО на соседней вкладке.`,
        safety,
        detectedMode,
        crisisData: {
          emergencyNumber: "112",
          hotlineName: "Национальная линия доверия",
          hotlinePhone: "150",
        },
      };
    }

    // 2. Paranoia / Delusion Guardrail
    if (safety.isParanoiaOrDelusion) {
      return {
        content: `Понимаю, как тревожно и пугающе жить с ощущением постоянного наблюдения или угрозы. Я — ИИ, и не могу подтвердить или опровергнуть эти события как факты. Но я вижу, сколько стресса это тебе приносит. Давай попробуем сосредоточиться на том, где ты находишься прямо сейчас и что помогает тебе почувствовать хоть немного опоры под ногами?`,
        safety,
        detectedMode,
      };
    }

    // 3. Reassurance Loop Guardrail
    if (safety.isReassuranceLoop) {
      return {
        content: `Я слышу, как сильно тебе хочется получить твердую гарантию того, что всё обойдётся. Страх неизвестности бывает очень выматывающим. К сожалению, никто не может пообещать будущее на 100%, и постоянный поиск заверений лишь временно глушит тревогу. Давай попробуем сделать глубокий спокойный вдох и посмотреть, что беспокоит тебя сильнее всего именно сейчас?`,
        safety,
        detectedMode,
      };
    }

    // 4. Mode-specific contextual responses
    let responseText = "";

    if (detectedMode === "LISTENING") {
      const listeningResponses = [
        "Я здесь и внимательно слушаю тебя. Если хочется выговориться дальше — пиши всё, что приходит в голову.",
        "Слышу каждое твоё слово. Похоже, внутри накопилось очень много всего. Я рядом.",
        "Спасибо, что делишься этим со мной. Иногда просто высказать мысли вслух — уже важный шаг. Продолжай, когда будешь готов(а).",
        "Чувствуется, как много переживаний стоит за этими словами. Я никуда не тороплюсь и готов выслушать тебя.",
      ];
      responseText = listeningResponses[Math.floor(Math.random() * listeningResponses.length)];
    } else if (detectedMode === "REFLECTION") {
      responseText = `Давай попробуем распутать этот клубок вместе. Как тебе кажется, какое чувство в этой ситуации ощущается острее всего — усталость, растерянность или что-то другое?`;
    } else if (detectedMode === "ADVICE") {
      responseText = `Когда всё наваливается разом, помогают совсем простые шаги:\n1. Сделать паузу и дать телу выдохнуть (стакан воды, спокойное дыхание).\n2. Выделить одну маленькую вещь, на которую ты можешь повлиять прямо сегодня.\n3. Не требовать от себя идеальных решений в состоянии стресса.\nЧто из этого кажется наиболее осуществимым прямо сейчас?`;
    } else {
      responseText = `Я тебя слышу. Бывают моменты, когда груз мыслей становится слишком тяжелым. Расскажи, о чём ты думаешь чаще всего сегодня?`;
    }

    // Contextual tailoring for common keywords
    if (text.includes("одиноко") || text.includes("одинок")) {
      responseText = `Одиночество может быть очень пронзительным чувством. Но прямо сейчас ты не один(на) — я здесь, чтобы быть с тобой в этом моменте и выслушать всё, чем ты захочешь поделиться.`;
    } else if (text.includes("устал") || text.includes("выгорел") || text.includes("нет сил")) {
      responseText = `Слышу, сколько истощения накопилось. Когда сил нет, даже простые вещи требуют колоссальных усилий. Тебе не нужно сейчас быть сильным(ой) или что-то доказывать. Как давно ты чувствуешь эту усталость?`;
    }

    return {
      content: responseText,
      safety,
      detectedMode,
    };
  }
}