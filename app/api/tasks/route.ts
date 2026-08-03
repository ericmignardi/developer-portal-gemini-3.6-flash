import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";
import { handleApiError, jsonResponse } from "@/lib/api-response";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as TaskPriority | null;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ status: "asc" }, { order: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return jsonResponse(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = taskSchema.parse(body);

    const completedAt = validated.status === "DONE" ? new Date() : null;

    const task = await prisma.task.create({
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

    return jsonResponse(task, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
