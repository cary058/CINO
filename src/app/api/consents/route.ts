export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { consents } = body; // array of string types

    if (!Array.isArray(consents) || consents.length === 0) {
      return NextResponse.json(
        { error: "Необходимо подтвердить обязательные согласия" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);

    for (const consentType of consents) {
      const existing = await prisma.userConsent.findFirst({
        where: { userId: user.id, consentType },
      });

      if (!existing) {
        await prisma.userConsent.create({
          data: {
            userId: user.id,
            consentType,
            documentVersion: "1.0",
            ipHash,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving consents:", error);
    return NextResponse.json({ error: "Не удалось сохранить согласия" }, { status: 500 });
  }
}