import { z } from "zod";

const prioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください");

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "タスク名を入力してください")
    .max(500, "タスク名は500文字以内で入力してください")
    .refine((val) => val.trim().length > 0, "タスク名を入力してください"),
  scheduledAt: dateStringSchema.optional(),
  categoryId: z.string().optional(),
  priority: prioritySchema.optional(),
  memo: z
    .string()
    .max(10000, "メモは10000文字以内で入力してください")
    .optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
  title: z
    .string()
    .min(1, "タスク名を入力してください")
    .max(500, "タスク名は500文字以内で入力してください")
    .refine((val) => val.trim().length > 0, "タスク名を入力してください")
    .optional(),
  scheduledAt: dateStringSchema.nullable().optional(),
  categoryId: z.string().nullable().optional(),
  priority: prioritySchema.nullable().optional(),
  memo: z
    .string()
    .max(10000, "メモは10000文字以内で入力してください")
    .nullable()
    .optional(),
});

export const taskIdSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
});

export const skipTaskSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
  reason: z
    .string()
    .max(1000, "理由は1000文字以内で入力してください")
    .optional(),
});

export const getTasksByDateSchema = z.object({
  date: dateStringSchema,
});

export const searchTasksSchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(["all", "pending", "completed", "skipped"]).optional(),
  categoryId: z.string().nullable().optional(),
  priority: prioritySchema.or(z.literal("all")).nullable().optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
});

export const getMonthlyTaskStatsSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "月はYYYY-MM形式で入力してください"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type SkipTaskInput = z.infer<typeof skipTaskSchema>;
export type GetTasksByDateInput = z.infer<typeof getTasksByDateSchema>;
export type SearchTasksInput = z.infer<typeof searchTasksSchema>;
export type GetMonthlyTaskStatsInput = z.infer<
  typeof getMonthlyTaskStatsSchema
>;
