import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { journalEntrySchema } from "@/lib/validations/journal";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const q = searchParams.get("q");

    const where: any = {};
    if (projectId) where.projectId = projectId;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    const formatted = entries.map((j) => ({
      ...j,
      tags: j.tags.map((t) => t.tag),
    }));

    return jsonResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = journalEntrySchema.parse(body);

    const { tagIds, ...entryData } = validated;

    const entry = await prisma.journalEntry.create({
      data: {
        ...entryData,
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
        ...entry,
        tags: entry.tags.map((t) => t.tag),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
