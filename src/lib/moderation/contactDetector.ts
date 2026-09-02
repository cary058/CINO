export interface ContactDetectionResult {
  hasContact: boolean;
  detectedTypes: string[];
  warningMessage?: string;
}

export function detectPersonalContacts(text: string): ContactDetectionResult {
  const detectedTypes: string[] = [];
  const normalized = text.toLowerCase();

  // 1. Phone numbers (e.g. +7 777 123 45 67, 87771234567, 8(701)...)
  const phoneRegex = /(?:\+?7|8)[\s\-\(]*[0-9]{3}[\s\-\)]*[0-9]{3}[\s\-]*[0-9]{2}[\s\-]*[0-9]{2}/g;
  const genericPhoneRegex = /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b/g;
  if (phoneRegex.test(normalized) || genericPhoneRegex.test(normalized)) {
    detectedTypes.push("номер телефона");
  }

  // 2. Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    detectedTypes.push("электронная почта");
  }

  // 3. Social media handles / keywords
  // Telegram: @username, t.me/username, тг: ..., телеграм: ...
  const tgRegex = /(?:@|(?:https?:\/\/)?t\.me\/|(?:^|\s)(?:тг|телеграм|telegram|тгшка)[\s:]+)([a-zA-Z0-9_]{4,})/i;
  if (tgRegex.test(text)) {
    detectedTypes.push("Telegram");
  }

  // Instagram: inst, инста, instagram.com/...
  const instaRegex = /(?:(?:https?:\/\/)?(?:www\.)?instagram\.com\/|(?:^|\s)(?:инста|инст|instagram)[\s:]+)([a-zA-Z0-9_.]+)/i;
  if (instaRegex.test(text)) {
    detectedTypes.push("Instagram");
  }

  // WhatsApp: ватсап, вацап, wa.me/...
  const waRegex = /(?:(?:https?:\/\/)?wa\.me\/|(?:^|\s)(?:ватсап|вацап|whatsapp)[\s:]+)/i;
  if (waRegex.test(text)) {
    detectedTypes.push("WhatsApp");
  }

  // VK: vk.com/...
  const vkRegex = /(?:(?:https?:\/\/)?vk\.com\/[a-zA-Z0-9_.]+)/i;
  if (vkRegex.test(text)) {
    detectedTypes.push("VK");
  }

  const hasContact = detectedTypes.length > 0;
  const warningMessage = hasContact
    ? `В сообщении обнаружены контактные данные (${detectedTypes.join(", ")}). В целях взаимной безопасности общение на платформе СИНО происходит строго внутри сервиса без обмена личными контактами.`
    : undefined;

  return {
    hasContact,
    detectedTypes,
    warningMessage,
  };
}