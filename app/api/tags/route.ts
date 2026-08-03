import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { tagCreateSchema } from "@/lib/validations/tag";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
    return jsonResponse(tags);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = tagCreateSchema.parse(body);

    const existing = await prisma.tag.findFirst({
      where: { name: { equals: validated.name, mode: "insensitive" } },
    });

    if (existing) {
      return jsonResponse(existing, 200);
    }

    const tag = await prisma.tag.create({
      data: validated,
    });
    return jsonResponse(tag, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
