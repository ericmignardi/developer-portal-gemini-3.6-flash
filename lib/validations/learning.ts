import { z } from "zod";

export const learningStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"]);

export const learningGoalSchema = z.object({
  title: z.string().min(1, "Goal title is required"),
  description: z.string().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
  status: learningStatusEnum.default("NOT_STARTED"),
});

export const learningGoalUpdateSchema = learningGoalSchema.partial();

export const courseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  provider: z.string().nullable().optional(),
  url: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  status: learningStatusEnum.default("NOT_STARTED"),
  progressPercent: z.number().int().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100").default(0),
  learningGoalId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const courseUpdateSchema = courseSchema.partial();

export type LearningGoalInput = z.infer<typeof learningGoalSchema>;
export type LearningGoalUpdateInput = z.infer<typeof learningGoalUpdateSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
