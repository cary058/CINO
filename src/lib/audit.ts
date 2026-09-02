import { prisma } from "./prisma";
import crypto from "crypto";

export async function logAuditEvent(params: {
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const ipHash = params.ipAddress
      ? crypto.createHash("sha256").update(params.ipAddress).digest("hex").substring(0, 16)
      : null;

    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        ipHash: ipHash,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}