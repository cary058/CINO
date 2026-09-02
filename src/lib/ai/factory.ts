import { AIProvider } from "./types";
import { MockAIProvider } from "./mockProvider";
import { GeminiAIProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openaiProvider";

export function getAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (providerName) {
    case "gemini":
      return new GeminiAIProvider();
    case "openai":
      return new OpenAIProvider();
    case "mock":
    default:
      return new MockAIProvider();
  }
}