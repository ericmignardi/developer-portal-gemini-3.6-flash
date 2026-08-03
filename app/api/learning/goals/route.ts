import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { learningGoalSchema } from "@/lib/validations/learning";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const goals = await prisma.learningGoal.findMany({
      include: {
        courses: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate rolled-up progress percent per goal
    const formatted = goals.map((goal) => {
      const courseCount = goal.courses.length;
      const progressRollup =
        courseCount === 0
          ? 0
          : Math.round(
              goal.courses.reduce((acc, c) => acc + c.progressPercent, 0) / courseCount
            );

      return {
        ...goal,
        progressRollup,
      };
    });

    return jsonResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = learningGoalSchema.parse(body);

    const goal = await prisma.learningGoal.create({
      data: validated,
      include: {
        courses: true,
      },
    });

    return jsonResponse(
      {
        ...goal,
        progressRollup: 0,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
