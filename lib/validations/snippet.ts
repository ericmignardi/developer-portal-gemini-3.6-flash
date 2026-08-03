import { z } from "zod";

export const snippetSchema = z.object({
  title: z.string().min(1, "Snippet title is required"),
  description: z.string().nullable().optional(),
  language: z.string().min(1, "Language is required").default("typescript"),
  code: z.string().min(1, "Code content is required"),
  projectId: z.string().nullable().optional(),
  isFavorite: z.boolean().default(false),
  tagIds: z.array(z.string()).optional(),
});

export const snippetUpdateSchema = snippetSchema.partial();

export type SnippetInput = z.infer<typeof snippetSchema>;
export type SnippetUpdateInput = z.infer<typeof snippetUpdateSchema>;
