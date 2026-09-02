import { SafetyCategory, RiskLevel, AIMode } from "@/types";

export interface AISafetyAnalysis {
  category: SafetyCategory;
  riskLevel: RiskLevel;
  triggers: string[];
  isCrisis: boolean;
  isParanoiaOrDelusion: boolean;
  isReassuranceLoop: boolean;
  crisisRecommendedAction?: "SHOW_CRISIS_HOTLINES" | "OFFER_HUMAN_SUPPORT" | "EMERGENCY_SERVICES";
}

export interface ChatMessageContext {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIGenerationRequest {
  userMessage: string;
  history: ChatMessageContext[];
  requestedMode?: AIMode;
}

export interface AIGenerationResponse {
  content: string;
  safety: AISafetyAnalysis;
  detectedMode: AIMode;
  crisisData?: {
    emergencyNumber: string;
    hotlineName: string;
    hotlinePhone: string;
  };
}

export interface AIProvider {
  name: string;
  generateResponse(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  classifySafety(message: string, history: ChatMessageContext[]): Promise<AISafetyAnalysis>;
}