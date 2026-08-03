import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").transform((val) => val.trim().toLowerCase()),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color code"),
});

export const tagCreateSchema = tagSchema;
export type TagInput = z.infer<typeof tagSchema>;
