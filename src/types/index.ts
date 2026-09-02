export type UserRole =
  | "USER"
  | "VOLUNTEER"
  | "COORDINATOR"
  | "PROFESSIONAL"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type SafetyCategory =
  | "NONE"
  | "GENERAL_DISTRESS"
  | "ANXIETY"
  | "PANIC"
  | "SELF_HARM"
  | "SUICIDE"
  | "VIOLENCE"
  | "PSYCHOSIS_OR_PARANOIA"
  | "ABUSE"
  | "MEDICAL_EMERGENCY"
  | "SUBSTANCE"
  | "EATING_DISORDER"
  | "OTHER_HIGH_RISK";

export type RiskLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type AIMode = "LISTENING" | "REFLECTION" | "ADVICE" | "CASUAL_SUPPORT";

export type HumanRequestStatus =
  | "REQUESTED"
  | "QUEUED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "WAITING_FOR_HUMAN"
  | "ACTIVE"
  | "TRANSFERRED"
  | "CLOSED"
  | "CANCELLED";

export type HumanRequestCategory =
  | "JUST_TALK"
  | "NEED_HUMAN"
  | "NEED_SUPPORT"
  | "DONT_KNOW"
  | "OTHER";

export type VolunteerStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "TRAINING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "PAUSED";

export type ProfessionalStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED";

export type ReportReason =
  | "OFFENSE"
  | "THREAT"
  | "SEXUAL"
  | "BOUNDARIES"
  | "HARMFUL_ADVICE"
  | "PRIVACY_BREACH"
  | "FRAUD"
  | "OTHER";

export type ReportStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  anonymousId: string;
  displayName: string | null;
  themePreference: "NIGHT" | "DAY" | "SYSTEM";
  language: string;
  hasAcceptedConsents: boolean;
  hasAcceptedHumanRules: boolean;
  volunteerProfile?: {
    status: VolunteerStatus;
    availability: AvailabilityStatus;
    trainingCompleted: boolean;
    maxActiveConversations: number;
    activeConversationsCount: number;
  } | null;
  professionalProfile?: {
    verificationStatus: ProfessionalStatus;
    availability: AvailabilityStatus;
    displayName: string;
    qualification: string;
    maxActiveConversations: number;
  } | null;
}