import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations/project";
import { slugify } from "@/lib/utils";
import { handleApiError, jsonResponse } from "@/lib/api-response";
import { ProjectStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ProjectStatus | null;
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { equals: tag.toLowerCase(), mode: "insensitive" },
          },
        },
      };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { client: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        environments: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            environments: true,
            snippets: true,
            journalEntries: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    const formatted = projects.map((p) => ({
      ...p,
      tags: p.tags.map((t) => t.tag),
    }));

    return jsonResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = projectSchema.parse(body);

    // Generate unique slug
    let baseSlug = slugify(validated.name);
    if (!baseSlug) baseSlug = "project";
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { tagIds, ...projectData } = validated;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        slug,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        environments: true,
        tags: { include: { tag: true } },
      },
    });

    return jsonResponse(
      {
        ...project,
        tags: project.tags.map((t) => t.tag),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
