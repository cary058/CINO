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
      const alreadyAsked = request.history
        .slice(-2)
        .some((item) => item.role === "assistant" && item.content.includes("Что в этом"));

      if (/(сосед|шум|музык|громк|не дают спать)/i.test(text)) {
        responseText = alreadyAsked
          ? "Похоже, это уже не просто раздражает, а постепенно выматывает. Можешь пожаловаться здесь столько, сколько нужно — я не буду торопить тебя советами."
          : "Когда шум повторяется по ночам и не получается отдохнуть, это правда может довести до злости и бессилия. Похоже, тебе сейчас хочется выговориться, а не сразу искать решение. Что в этой ситуации задевает сильнее всего?";
      } else if (/(обидно|злюсь|злость|раздражает|бесит)/i.test(text)) {
        responseText = "Похоже, тебя это правда задело и накопилось много злости. Не нужно сейчас оправдывать это чувство или срочно с ним что-то делать. Хочешь рассказать, что произошло?";
      } else if (/(одиноко|одинок)/i.test(text)) {
        responseText = "Одиночество может особенно остро ощущаться, когда хочется, чтобы кто-то просто побыл рядом. Я здесь и могу тебя послушать. Что сегодня сильнее всего напомнило об этом?";
      } else if (/(устал|выгорел|нет сил)/i.test(text)) {
        responseText = "Похоже, ты сильно вымотался и даже обычные дела сейчас могут даваться тяжелее. Не обязательно прямо сейчас собираться и всё исправлять. Как давно ты так себя чувствуешь?";
      } else {
        const previousReply = request.history.at(-1)?.role === "assistant" ? request.history.at(-1)?.content : "";
        const listeningResponses = [
          "Я с тобой. Можешь продолжить с того места, которое сейчас сильнее всего крутится в голове.",
          "Похоже, в этом для тебя много чувств. Я не буду торопить тебя советами — расскажи столько, сколько хочется.",
          "Спасибо, что рассказал(а). Что в этой ситуации сейчас тяжелее всего именно для тебя?",
        ].filter((reply) => reply !== previousReply);
        responseText = listeningResponses[Math.floor(Math.random() * listeningResponses.length)];
      }
    } else if (detectedMode === "REFLECTION") {
      responseText = `Давай попробуем распутать этот клубок вместе. Как тебе кажется, какое чувство в этой ситуации ощущается острее всего — усталость, растерянность или что-то другое?`;
    } else if (detectedMode === "ADVICE") {
      responseText = `Если хочется попробовать решить именно эту ситуацию, можно начать с одного спокойного шага: ${/(сосед|шум|музык|громк|не дают спать)/i.test(text) ? "выбрать безопасный момент и коротко попросить соседей соблюдать тишину ночью, а если это не поможет — записать даты и время шума и уточнить правила дома" : "понять, какая небольшая часть происходящего сейчас зависит от тебя"}. Но не обязательно делать это прямо сейчас. Хочешь, подумаем вместе, какой вариант подошёл бы тебе?`;
    } else {
      responseText = `Я тебя слышу. Бывают моменты, когда груз мыслей становится слишком тяжелым. Расскажи, о чём ты думаешь чаще всего сегодня?`;
    }

    return {
      content: responseText,
      safety,
      detectedMode,
    };
  }
}

