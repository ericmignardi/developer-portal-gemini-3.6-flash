import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { environmentSchema } from "@/lib/validations/environment";
import { handleApiError, jsonResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const environments = await prisma.environment.findMany({
      where,
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    });

    return jsonResponse(environments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = environmentSchema.parse(body);

    const environment = await prisma.environment.create({
      data: validated,
    });

    return jsonResponse(environment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
