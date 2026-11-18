export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "coordinator:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // 1. Fetch queue requests
    const requests = await prisma.humanSupportRequest.findMany({
      where: {
        status: { in: ["REQUESTED", "QUEUED", "UNDER_REVIEW", "ASSIGNED", "ACTIVE", "TRANSFERRED"] },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            anonymousId: true,
            createdAt: true,
          },
        },
        chat: {
          include: {
            helper: {
              select: {
                id: true,
                anonymousId: true,
                role: true,
                profile: { select: { displayName: true } },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        internalNotes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // 2. Fetch available volunteers
    const availableVolunteers = await prisma.volunteerProfile.findMany({
      where: {
        status: "APPROVED",
        availability: "AVAILABLE",
      },
      include: {
        user: {
          select: {
            id: true,
            anonymousId: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    // Show every verified professional so the coordinator can see who is free,
    // busy, or off shift. Demo profiles are only included in demo deployments.
    const verificationStatuses = process.env.DEMO_MODE === "true"
      ? ["VERIFIED", "DEMO_VERIFIED", "PENDING"]
      : ["VERIFIED"];
    const professionals = await prisma.professionalProfile.findMany({
      where: {
        verificationStatus: { in: verificationStatuses },
      },
      include: {
        user: {
          select: {
            id: true,
            anonymousId: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      requests,
      availableVolunteers,
      professionals,
    });
  } catch (error) {
    console.error("Error fetching coordinator queue:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

