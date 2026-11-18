import { AIProvider } from "./types";
import { MockAIProvider } from "./mockProvider";
import { GeminiAIProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openaiProvider";

export function getAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (providerName) {
    case "gemini":
      return process.env.AI_API_KEY?.trim() ? new GeminiAIProvider() : new MockAIProvider();
    case "openai":
      return process.env.AI_API_KEY?.trim() ? new OpenAIProvider() : new MockAIProvider();
    case "mock":
    default:
      return new MockAIProvider();
  }
}