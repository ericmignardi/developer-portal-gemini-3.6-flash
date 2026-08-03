import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { environmentUpdateSchema } from "@/lib/validations/environment";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = environmentUpdateSchema.parse(body);

    const existing = await prisma.environment.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Environment not found");
    }

    const updated = await prisma.environment.update({
      where: { id },
      data: validated,
    });

    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.environment.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Environment not found");
    }

    await prisma.environment.delete({
      where: { id },
    });

    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
