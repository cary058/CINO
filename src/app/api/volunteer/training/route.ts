export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, "volunteer:training")) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const course = await prisma.trainingCourse.findFirst({
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ modules: [], progress: null });
    }

    const progress = await prisma.volunteerProgress.findUnique({
      where: { userId: user.id },
    });

    const userAttempts = await prisma.trainingAttempt.findMany({
      where: { userId: user.id },
    });

    const formattedModules = course.modules.map((m) => {
      const quiz = JSON.parse(m.quizJson || "{}");
      const passedAttempt = userAttempts.find((a) => a.moduleId === m.id && a.passed);

      return {
        id: m.id,
        order: m.order,
        title: m.title,
        content: m.content,
        quiz: {
          question: quiz.question,
          options: quiz.options,
        },
        isCompleted: !!passedAttempt,
      };
    });

    return NextResponse.json({
      courseTitle: course.title,
      modules: formattedModules,
      progress: progress || { completedModules: 0, totalModules: 10, trainingCompleted: false },
    });
  } catch (error) {
    console.error("Error fetching training:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

