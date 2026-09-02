import { describe, it, expect } from "vitest";
import { detectPersonalContacts } from "../src/lib/moderation/contactDetector";

describe("Contact Exchange Safety Detector", () => {
  it("flags phone numbers", () => {
    const res = detectPersonalContacts("Напиши мне на 87771234567, там быстрее");
    expect(res.hasContact).toBe(true);
    expect(res.detectedTypes).toContain("номер телефона");
  });

  it("flags telegram handles", () => {
    const res = detectPersonalContacts("Мой телеграм: @alex_help, пиши туда");
    expect(res.hasContact).toBe(true);
    expect(res.detectedTypes).toContain("Telegram");
  });

  it("flags emails", () => {
    const res = detectPersonalContacts("Моя почта user@example.com для связи");
    expect(res.hasContact).toBe(true);
    expect(res.detectedTypes).toContain("электронная почта");
  });

  it("allows normal conversations without false positives", () => {
    const res = detectPersonalContacts("Мне очень тяжело и одиноко, спасибо что слушаешь меня");
    expect(res.hasContact).toBe(false);
  });
});