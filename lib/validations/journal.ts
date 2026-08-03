import { z } from "zod";

export const journalEntrySchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().min(1, "Journal content is required"),
  entryDate: z.coerce.date().default(() => new Date()),
  projectId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export const journalEntryUpdateSchema = journalEntrySchema.partial();

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type JournalEntryUpdateInput = z.infer<typeof journalEntryUpdateSchema>;
