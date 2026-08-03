import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { journalEntryUpdateSchema } from "@/lib/validations/journal";
import { handleApiError, jsonResponse, notFoundResponse, emptySuccessResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!entry) return notFoundResponse("Journal entry not found");

    return jsonResponse({
      ...entry,
      tags: entry.tags.map((t) => t.tag),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = journalEntryUpdateSchema.parse(body);

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Journal entry not found");

    const { tagIds, ...entryData } = validated;

    if (tagIds !== undefined) {
      await prisma.tagOnJournalEntry.deleteMany({ where: { journalEntryId: id } });
      if (tagIds.length > 0) {
        await prisma.tagOnJournalEntry.createMany({
          data: tagIds.map((tagId) => ({ journalEntryId: id, tagId })),
        });
      }
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: entryData,
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
    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Journal entry not found");

    await prisma.journalEntry.delete({ where: { id } });
    return emptySuccessResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
