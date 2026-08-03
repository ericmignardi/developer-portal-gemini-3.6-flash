import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations/learning";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    const where: any = {};
    if (goalId === "none") {
      where.learningGoalId = null;
    } else if (goalId) {
      where.learningGoalId = goalId;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        learningGoal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(courses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = courseSchema.parse(body);

    let progressPercent = validated.progressPercent;
    if (validated.status === "COMPLETED") {
      progressPercent = 100;
    }

    const course = await prisma.course.create({
      data: {
        ...validated,
        progressPercent,
      },
      include: {
        learningGoal: { select: { id: true, title: true } },
      },
    });

    return jsonResponse(course, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
