import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { courseUpdateSchema } from "@/lib/validations/learning";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = courseUpdateSchema.parse(body);

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Course not found");

    let progressPercent = validated.progressPercent !== undefined ? validated.progressPercent : existing.progressPercent;
    let status = validated.status !== undefined ? validated.status : existing.status;

    // PRD §7.9: Setting a course to COMPLETED forces progress to 100
    if (validated.status === "COMPLETED") {
      progressPercent = 100;
    } else if (validated.progressPercent === 100 && status !== "COMPLETED") {
      status = "COMPLETED";
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...validated,
        status,
        progressPercent,
      },
      include: {
        learningGoal: { select: { id: true, title: true } },
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Course not found");

    await prisma.course.delete({ where: { id } });
    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
