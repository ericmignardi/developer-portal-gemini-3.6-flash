import { z } from "zod";

export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  status: taskStatusEnum.default("TODO"),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: z.coerce.date().nullable().optional(),
  projectId: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

export const taskUpdateSchema = taskSchema.partial();

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
