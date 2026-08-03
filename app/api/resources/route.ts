import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations/resource";
import { handleApiError, jsonResponse } from "@/lib/api-response";
import { ResourceType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ResourceType | null;
    const tag = searchParams.get("tag");
    const isReadParam = searchParams.get("isRead");
    const q = searchParams.get("q");

    const where: any = {};
    if (type) where.type = type;
    if (isReadParam === "true") where.isRead = true;
    if (isReadParam === "false") where.isRead = false;

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
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { url: { contains: q, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    });

    const formatted = resources.map((r) => ({
      ...r,
      tags: r.tags.map((t) => t.tag),
    }));

    return jsonResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resourceSchema.parse(body);

    const { tagIds, ...resourceData } = validated;

    const resource = await prisma.resource.create({
      data: {
        ...resourceData,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    return jsonResponse(
      {
        ...resource,
        tags: resource.tags.map((t) => t.tag),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
