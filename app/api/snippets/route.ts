import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { snippetSchema } from "@/lib/validations/snippet";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    const favoriteParam = searchParams.get("favorite");

    const where: any = {};
    if (language) where.language = { equals: language, mode: "insensitive" };
    if (favoriteParam === "true") where.isFavorite = true;

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
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const snippets = await prisma.snippet.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    });

    const formatted = snippets.map((s) => ({
      ...s,
      tags: s.tags.map((t) => t.tag),
    }));

    return jsonResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = snippetSchema.parse(body);

    const { tagIds, ...snippetData } = validated;

    const snippet = await prisma.snippet.create({
      data: {
        ...snippetData,
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
        ...snippet,
        tags: snippet.tags.map((t) => t.tag),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
