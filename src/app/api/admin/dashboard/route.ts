export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "admin:dashboard")) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const [
      totalUsers,
      totalAIChats,
      totalAIMessages,
      totalHumanRequests,
      waitingRequests,
      activeHumanChats,
      availableVolunteers,
      availableProfessionals,
      openReports,
      safetyEventsCount,
      criticalSafetyEvents,
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: "DELETED" } } }),
      prisma.aIChat.count({ where: { status: { not: "DELETED" } } }),
      prisma.aIMessage.count(),
      prisma.humanSupportRequest.count(),
      prisma.humanSupportRequest.count({ where: { status: { in: ["REQUESTED", "QUEUED"] } } }),
      prisma.humanChat.count({ where: { status: "ACTIVE" } }),
      prisma.volunteerProfile.count({ where: { status: "APPROVED", availability: "AVAILABLE" } }),
      prisma.professionalProfile.count({ where: { verificationStatus: "VERIFIED", availability: "AVAILABLE" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.safetyEvent.count(),
      prisma.safetyEvent.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
    ]);

    const recentSafetyEvents = await prisma.safetyEvent.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { anonymousId: true } },
      },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { anonymousId: true, role: true } },
      },
    });

    // Fetch Kill Switch states
    const aiSetting = await prisma.systemSetting.findUnique({ where: { key: "ENABLE_AI" } });
    const humanSetting = await prisma.systemSetting.findUnique({ where: { key: "ENABLE_HUMAN_SUPPORT" } });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalAIChats,
        totalAIMessages,
        totalHumanRequests,
        waitingRequests,
        activeHumanChats,
        availableVolunteers,
        availableProfessionals,
        openReports,
        safetyEventsCount,
        criticalSafetyEvents,
      },
      killSwitches: {
        enableAI: aiSetting ? aiSetting.value === "true" : true,
        enableHumanSupport: humanSetting ? humanSetting.value === "true" : true,
      },
      recentSafetyEvents,
      recentAuditLogs,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}