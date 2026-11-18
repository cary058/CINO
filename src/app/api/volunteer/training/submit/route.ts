export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "volunteer:training")) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, selectedIndex } = body;

    const mod = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
    if (!mod) {
      return NextResponse.json({ error: "Модуль не найден" }, { status: 404 });
    }

    const quiz = JSON.parse(mod.quizJson || "{}");
    const isCorrect = selectedIndex === quiz.correctIndex;

    // Record attempt
    await prisma.trainingAttempt.create({
      data: {
        userId: user.id,
        moduleId,
        score: isCorrect ? 100 : 0,
        passed: isCorrect,
      },
    });

    if (!isCorrect) {
      return NextResponse.json({
        success: false,
        passed: false,
        message: "Ответ неверный. Пожалуйста, перечитайте материалы модуля и попробуйте ещё раз.",
      });
    }

    // Count unique passed modules
    const allPassed = await prisma.trainingAttempt.findMany({
      where: { userId: user.id, passed: true },
      distinct: ["moduleId"],
    });

    const completedCount = allPassed.length;
    const isFinished = completedCount >= 10;

    await prisma.volunteerProgress.upsert({
      where: { userId: user.id },
      update: {
        completedModules: completedCount,
        trainingCompleted: isFinished,
      },
      create: {
        userId: user.id,
        completedModules: completedCount,
        totalModules: 10,
        trainingCompleted: isFinished,
      },
    });

    return NextResponse.json({
      success: true,
      passed: true,
      completedModules: completedCount,
      trainingCompleted: isFinished,
      message: isFinished
        ? "🎉 Поздравляем! Вы успешно завершили все 10 обучающих модулей. Ваша заявка передана администраторам на проверку."
        : "✅ Верно! Модуль успешно пройден.",
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ error: "Ошибка при проверке ответа" }, { status: 500 });
  }
}

