import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { learningGoalUpdateSchema } from "@/lib/validations/learning";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = learningGoalUpdateSchema.parse(body);

    const existing = await prisma.learningGoal.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Learning goal not found");

    const updated = await prisma.learningGoal.update({
      where: { id },
      data: validated,
      include: { courses: true },
    });

    const courseCount = updated.courses.length;
    const progressRollup =
      courseCount === 0
        ? 0
        : Math.round(
            updated.courses.reduce((acc, c) => acc + c.progressPercent, 0) / courseCount
          );

    return jsonResponse({
      ...updated,
      progressRollup,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.learningGoal.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Learning goal not found");

    await prisma.learningGoal.delete({ where: { id } });
    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
