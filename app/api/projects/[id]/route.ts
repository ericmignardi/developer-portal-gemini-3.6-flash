import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validations/project";
import { slugify } from "@/lib/utils";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        environments: {
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        },
        snippets: {
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: "desc" },
        },
        journalEntries: {
          include: { tags: { include: { tag: true } } },
          orderBy: { entryDate: "desc" },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!project) {
      return notFoundResponse("Project not found");
    }

    return jsonResponse({
      ...project,
      tags: project.tags.map((t) => t.tag),
      snippets: project.snippets.map((s) => ({ ...s, tags: s.tags.map((t) => t.tag) })),
      journalEntries: project.journalEntries.map((j) => ({ ...j, tags: j.tags.map((t) => t.tag) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = projectUpdateSchema.parse(body);

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return notFoundResponse("Project not found");
    }

    const { tagIds, name, ...dataToUpdate } = validated;

    let slug = existing.slug;
    if (name && name !== existing.name) {
      let baseSlug = slugify(name);
      if (!baseSlug) baseSlug = "project";
      slug = baseSlug;
      let counter = 1;

      while (
        await prisma.project.findFirst({
          where: { slug, NOT: { id: existing.id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Handle tag connections if provided
    if (tagIds !== undefined) {
      await prisma.tagOnProject.deleteMany({
        where: { projectId: existing.id },
      });
      if (tagIds.length > 0) {
        await prisma.tagOnProject.createMany({
          data: tagIds.map((tagId) => ({ projectId: existing.id, tagId })),
        });
      }
    }

    const updated = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...dataToUpdate,
        ...(name ? { name, slug } : {}),
      },
      include: {
        environments: true,
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

    const existing = await prisma.project.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return notFoundResponse("Project not found");
    }

    await prisma.project.delete({
      where: { id: existing.id },
    });

    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
