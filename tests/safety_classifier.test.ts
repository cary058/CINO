import { describe, it, expect } from "vitest";
import { analyzeMessageSafety } from "../src/lib/ai/safetyLayer";

describe("AI Safety Classifier & Guardrails", () => {
  it("detects critical suicide / self-harm intent", () => {
    const result = analyzeMessageSafety("Мне так больно, я хочу покончить с собой прямо сейчас");
    expect(result.riskLevel).toBe("CRITICAL");
    expect(result.category).toBe("SUICIDE");
    expect(result.isCrisis).toBe(true);
  });

  it("detects self-harm and flags high risk", () => {
    const result = analyzeMessageSafety("Я постоянно наношу себе порезы когда плохо");
    expect(result.riskLevel).toBe("HIGH");
    expect(result.category).toBe("SELF_HARM");
    expect(result.isCrisis).toBe(true);
  });

  it("detects paranoia / delusion themes and sets flag without panic", () => {
    const result = analyzeMessageSafety("Я уверен, что за мной следят соседи через стены и слушают мысли");
    expect(result.isParanoiaOrDelusion).toBe(true);
    expect(result.category).toBe("PSYCHOSIS_OR_PARANOIA");
  });

  it("detects reassurance loop demands", () => {
    const history = [
      { role: "user" as const, content: "Точно всё будет хорошо?" },
      { role: "assistant" as const, content: "Я слышу твою тревогу." },
    ];
    const result = analyzeMessageSafety("Поклянись, точно ничего плохого не случится?", history);
    expect(result.isReassuranceLoop).toBe(true);
  });

  it("classifies general emotional distress with low risk", () => {
    const result = analyzeMessageSafety("Мне очень тяжело в последнее время, я устал от работы");
    expect(result.category).toBe("GENERAL_DISTRESS");
    expect(result.riskLevel).toBe("LOW");
    expect(result.isCrisis).toBe(false);
  });
});