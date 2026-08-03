import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { snippetUpdateSchema } from "@/lib/validations/snippet";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = snippetUpdateSchema.parse(body);

    const existing = await prisma.snippet.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Snippet not found");

    const { tagIds, ...snippetData } = validated;

    if (tagIds !== undefined) {
      await prisma.tagOnSnippet.deleteMany({ where: { snippetId: id } });
      if (tagIds.length > 0) {
        await prisma.tagOnSnippet.createMany({
          data: tagIds.map((tagId) => ({ snippetId: id, tagId })),
        });
      }
    }

    const updated = await prisma.snippet.update({
      where: { id },
      data: snippetData,
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
    const existing = await prisma.snippet.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Snippet not found");

    await prisma.snippet.delete({ where: { id } });
    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
