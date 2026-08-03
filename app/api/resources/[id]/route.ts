import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceUpdateSchema } from "@/lib/validations/resource";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = resourceUpdateSchema.parse(body);

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Resource not found");

    const { tagIds, ...resourceData } = validated;

    if (tagIds !== undefined) {
      await prisma.tagOnResource.deleteMany({ where: { resourceId: id } });
      if (tagIds.length > 0) {
        await prisma.tagOnResource.createMany({
          data: tagIds.map((tagId) => ({ resourceId: id, tagId })),
        });
      }
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: resourceData,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    return jsonResponse({
      ...updated,
      tags: updated.tags.map((t) => t.tag),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Resource not found");

    await prisma.resource.delete({ where: { id } });
    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
