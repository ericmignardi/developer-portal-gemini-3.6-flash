import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    const issues = (error as any).issues || (error as any).errors || [];
    issues.forEach((err: any) => {
      const path = Array.isArray(err.path) ? err.path.join(".") : String(err.path || "root");
      if (!fields[path]) fields[path] = [];
      fields[path].push(err.message);
    });
    return NextResponse.json({ error: "Validation failure", fields }, { status: 400 });
  }

  console.error("API Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function emptySuccessResponse() {
  return new NextResponse(null, { status: 204 });
}

export function notFoundResponse(message = "Resource not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
