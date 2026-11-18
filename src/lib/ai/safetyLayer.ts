import { AISafetyAnalysis, ChatMessageContext } from "./types";
import { SafetyCategory, RiskLevel } from "@/types";

export function analyzeMessageSafety(
  message: string,
  history: ChatMessageContext[] = []
): AISafetyAnalysis {
  const text = message.toLowerCase().trim();
  const triggers: string[] = [];
  const intrusiveThoughtRegex =
    /(навязчив(?:ые|ая|ый|о)? мысли?|назойлив(?:ые|ая|ый|о)? мысли?|мысл(?:ь|и).{0,40}(?:не отпускает|не отпускают|крутится|крутятся|возвращается|возвращаются|зациклил)|мысл(?:ь|и).{0,80}(?:суицид|самоубийств|покончить с собой|убить себя|навредить себе|причинить вред|убить кого-то|ударить близкого)|не могу перестать думать|страшно от (?:этой )?мысли|а вдруг я.{0,50}(?:наврежу|причиню вред|ударю|убью))/i;
  const recentUserMessages = history
    .filter((item) => item.role === "user")
    .slice(-2)
    .map((item) => item.content.toLowerCase());
  const isIntrusiveThought =
    intrusiveThoughtRegex.test(text) || recentUserMessages.some((item) => intrusiveThoughtRegex.test(item));

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
      isIntrusiveThought,
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
      isIntrusiveThought,
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
      isIntrusiveThought,
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
      isIntrusiveThought,
      crisisRecommendedAction: "SHOW_CRISIS_HOTLINES",
    };
  }

  // 4. Paranoia / Delusional Themes
  const paranoiaRegex =
    /(за мной следят|за мной наблюдают|соседи (?:следят|облучают|отравляют)|(?:все|всё) против меня сговорились|(?:чип|жучок|микрофон) (?:в голове|в теле|вживили)|слышу голоса.{0,40}(?:приказывают|говорят сделать))/i;
  const isParanoiaOrDelusion = paranoiaRegex.test(text);

  // 5. Reassurance loop detector
  const reassuranceRegex =
    /(скажи.{0,20}точно|точно ли|точно (?:всё|все|ничего|я не)|поклянись|гарантируй|обещай.{0,20}(?:что|не)|точно ничего.{0,20}не случится|проверь.{0,20}(?:ещё раз|еще раз|снова|опять)|не опасно ли|а вдруг.{0,40}(?:случится|значит|я не))/i;
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
      isIntrusiveThought,
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
      isIntrusiveThought,
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
      isIntrusiveThought,
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
      isIntrusiveThought,
    };
  }

  return {
    category: "NONE",
    riskLevel: "NONE",
    triggers: [],
    isCrisis: false,
    isParanoiaOrDelusion: false,
    isReassuranceLoop: isReassuranceLoop,
    isIntrusiveThought,
  };
}

