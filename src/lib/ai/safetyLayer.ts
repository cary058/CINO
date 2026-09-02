import { AISafetyAnalysis, ChatMessageContext } from "./types";
import { SafetyCategory, RiskLevel } from "@/types";

export function analyzeMessageSafety(
  message: string,
  history: ChatMessageContext[] = []
): AISafetyAnalysis {
  const text = message.toLowerCase().trim();
  const triggers: string[] = [];

  // 1. Suicide / Self-Harm (CRITICAL / HIGH)
  const suicideRegex = /(хочу умереть|покончить с собой|суицид|не хочу жить|убить себя|наложить на себя руки|спрыгнуть с|порезать вены|перерезать вены|выпить таблеток чтобы умереть|вскрыть вены)/i;
  const selfHarmRegex = /(режу себя|причинить себе боль|наношу.*порез|порезы|селфхарм|навредить себе|хочу причинить себе вред|самоповрежден)/i;

  if (suicideRegex.test(text)) {
    triggers.push("suicide_intent");
    return {
      category: "SUICIDE",
      riskLevel: "CRITICAL",
      triggers,
      isCrisis: true,
      isParanoiaOrDelusion: false,
      isReassuranceLoop: false,
      crisisRecommendedAction: "EMERGENCY_SERVICES",
    };
  }

  if (selfHarmRegex.test(text)) {
    triggers.push("self_harm");
    return {
      category: "SELF_HARM",
      riskLevel: "HIGH",
      triggers,
      isCrisis: true,
      isParanoiaOrDelusion: false,
      isReassuranceLoop: false,
      crisisRecommendedAction: "OFFER_HUMAN_SUPPORT",
    };
  }

  // 2. Violence against others (HIGH / CRITICAL)
  const violenceRegex = /(хочу убить кого-то|зарезать|устроить резню|напасть с ножом|застрелить)/i;
  if (violenceRegex.test(text)) {
    triggers.push("violence_intent");
    return {
      category: "VIOLENCE",
      riskLevel: "CRITICAL",
      triggers,
      isCrisis: true,
      isParanoiaOrDelusion: false,
      isReassuranceLoop: false,
      crisisRecommendedAction: "EMERGENCY_SERVICES",
    };
  }

  // 3. Abuse / Domestic Violence (HIGH)
  const abuseRegex = /(меня бьют|домашнее насилие|муж избивает|родители бьют|меня удерживают силой|угрожает расправой)/i;
  if (abuseRegex.test(text)) {
    triggers.push("domestic_abuse");
    return {
      category: "ABUSE",
      riskLevel: "HIGH",
      triggers,
      isCrisis: true,
      isParanoiaOrDelusion: false,
      isReassuranceLoop: false,
      crisisRecommendedAction: "SHOW_CRISIS_HOTLINES",
    };
  }

  // 4. Paranoia / Delusional Themes
  const paranoiaRegex = /(за мной следят|чип в голове|спецслужбы в стенах|соседи облучают|все против меня заговор|слышу голоса в голове которые приказывают|вживили жучки)/i;
  const isParanoiaOrDelusion = paranoiaRegex.test(text);

  // 5. Reassurance loop detector
  const reassuranceRegex = /(точно всё будет хорошо|точно я не умру|скажи точно|поклянись|гарантируй|точно ничего.*не случится|точно.*обоSource:?йдется)/i;
  let isReassuranceLoop = false;
  if (reassuranceRegex.test(text)) {
    const recentReassurances = history
      .slice(-4)
      .filter((h) => h.role === "user" && reassuranceRegex.test(h.content.toLowerCase()));
    if (recentReassurances.length >= 1 || text.includes("поклянись")) {
      isReassuranceLoop = true;
    }
  }

  // 6. Panic Attack
  const panicRegex = /(паническая атака|задыхаюсь от страха|сердце бешено колотится|кажется схожу с ума от паники)/i;
  if (panicRegex.test(text)) {
    triggers.push("panic_attack");
    return {
      category: "PANIC",
      riskLevel: "MODERATE",
      triggers,
      isCrisis: false,
      isParanoiaOrDelusion,
      isReassuranceLoop,
      crisisRecommendedAction: "OFFER_HUMAN_SUPPORT",
    };
  }

  // 7. Anxiety / General Distress
  const anxietyRegex = /(очень тревожно|страшно|не нахожу себе места|волнуюсь|внутри всё сжимается|боюсь)/i;
  if (anxietyRegex.test(text)) {
    return {
      category: "ANXIETY",
      riskLevel: "LOW",
      triggers: ["anxiety_keywords"],
      isCrisis: false,
      isParanoiaOrDelusion,
      isReassuranceLoop,
    };
  }

  const distressRegex = /(тяжело|одиноко|устал(а)? от всего|грустно|плачу|больно на душе|пустота|устал)/i;
  if (distressRegex.test(text)) {
    return {
      category: "GENERAL_DISTRESS",
      riskLevel: "LOW",
      triggers: ["distress_keywords"],
      isCrisis: false,
      isParanoiaOrDelusion,
      isReassuranceLoop,
    };
  }

  if (isParanoiaOrDelusion) {
    return {
      category: "PSYCHOSIS_OR_PARANOIA",
      riskLevel: "MODERATE",
      triggers: ["paranoia_keywords"],
      isCrisis: false,
      isParanoiaOrDelusion: true,
      isReassuranceLoop,
    };
  }

  return {
    category: "NONE",
    riskLevel: "NONE",
    triggers: [],
    isCrisis: false,
    isParanoiaOrDelusion: false,
    isReassuranceLoop: isReassuranceLoop,
  };
}