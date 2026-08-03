import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations/task";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = taskUpdateSchema.parse(body);

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Task not found");
    }

    let completedAt = existing.completedAt;
    if (validated.status !== undefined) {
      if (validated.status === "DONE" && existing.status !== "DONE") {
        completedAt = new Date();
      } else if (validated.status !== "DONE" && existing.status === "DONE") {
        completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...validated,
        completedAt,
      },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
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

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Task not found");
    }

    await prisma.task.delete({
      where: { id },
    });

    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
