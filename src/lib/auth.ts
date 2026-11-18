import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SessionUser, UserRole, UserStatus } from "@/types";
import { isStaff } from "./rbac";

function getJwtSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32 || /change|replace|example|sino-(default|super-secret)|your[-_]/i.test(secret)) {
      throw new Error("SESSION_SECRET must be a unique secret of at least 32 characters in production.");
    }
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(secret || "sino-local-development-secret-not-for-production");
}
const COOKIE_NAME = "sino_session";

function allowedStaffEmails(): Set<string> {
  return new Set(
    (process.env.STAFF_ACCESS_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isStaffAccessAllowed(email: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return allowedStaffEmails().has(email.trim().toLowerCase());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAnonymousId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "SINO-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret());
    return { userId: verified.payload.userId as string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        consents: true,
        volunteerProfile: true,
        professionalProfile: true,
        volunteerProgress: true,
      },
    });

    if (!user || user.status === "DELETED") return null;

    const hasAcceptedConsents =
      user.consents.some((c) => c.consentType === "TERMS") &&
      user.consents.some((c) => c.consentType === "PRIVACY") &&
      user.consents.some((c) => c.consentType === "AI_ACKNOWLEDGEMENT") &&
      user.consents.some((c) => c.consentType === "LIMITATIONS");

    const hasAcceptedHumanRules = user.consents.some((c) => c.consentType === "HUMAN_RULES");

    const effectiveRole =
      isStaff(user.role as UserRole) && !isStaffAccessAllowed(user.email)
        ? "USER"
        : (user.role as UserRole);

    return {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      status: user.status as UserStatus,
      anonymousId: user.anonymousId,
      displayName: user.profile?.displayName || "Пользователь",
      themePreference: (user.profile?.themePreference as any) || "NIGHT",
      language: user.profile?.language || "ru",
      hasAcceptedConsents,
      hasAcceptedHumanRules,
      volunteerProfile: user.volunteerProfile
        ? {
            status: user.volunteerProfile.status as any,
            availability: user.volunteerProfile.availability as any,
            trainingCompleted: !!user.volunteerProgress?.[0]?.trainingCompleted,
            maxActiveConversations: user.volunteerProfile.maxActiveConversations,
            activeConversationsCount: user.volunteerProfile.activeConversationsCount,
          }
        : null,
      professionalProfile: user.professionalProfile
        ? {
            verificationStatus: user.professionalProfile.verificationStatus as any,
            availability: user.professionalProfile.availability as any,
            displayName: user.professionalProfile.displayName,
            qualification: user.professionalProfile.qualification,
            maxActiveConversations: user.professionalProfile.maxActiveConversations,
          }
        : null,
    };
  } catch (err) {
    console.error("Error retrieving current user:", err);
    return null;
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function deleteSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

