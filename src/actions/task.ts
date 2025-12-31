"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import {
  type ActionResult,
  success,
  failure,
  type Task,
  type TodayTasks,
  type DateTasks,
  type SearchTasksResult,
} from "@/types";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  skipTaskSchema,
  getTasksByDateSchema,
  searchTasksSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type SkipTaskInput,
  type GetTasksByDateInput,
  type SearchTasksInput,
} from "@/lib/validations";
import type { Task as PrismaTask, Category } from "@/generated/prisma/client";

// Helper: Convert Prisma task to API task type
function toTask(
  task: PrismaTask & { category: Category | null }
): Task {
  return {
    id: task.id,
    title: task.title,
    memo: task.memo,
    status: task.status,
    priority: task.priority,
    scheduledAt: task.scheduledAt
      ? task.scheduledAt.toISOString().split("T")[0]
      : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    skippedAt: task.skippedAt ? task.skippedAt.toISOString() : null,
    skipReason: task.skipReason,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    categoryId: task.categoryId,
    category: task.category
      ? {
          id: task.category.id,
          name: task.category.name,
          color: task.category.color,
        }
      : null,
  };
}

// Helper: Get start and end of a date in UTC
function getDateRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr + "T00:00:00.000Z");
  const end = new Date(dateStr + "T23:59:59.999Z");
  return { start, end };
}

// Helper: Get today's date string in YYYY-MM-DD format
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayTasks(): Promise<ActionResult<TodayTasks>> {
  try {
    const user = await getRequiredUser();
    const today = getTodayString();
    const { start: todayStart, end: todayEnd } = getDateRange(today);

    const [overdue, todayTasks, undated, completed, skipped] = await Promise.all([
      // Overdue: scheduled before today and still pending
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          scheduledAt: { lt: new Date(today) },
        },
        include: { category: true },
        orderBy: { scheduledAt: "asc" },
      }),
      // Today: scheduled for today and pending
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          scheduledAt: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      // Undated: no scheduled date and pending
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          scheduledAt: null,
        },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      // Completed today
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "COMPLETED",
          completedAt: { gte: todayStart, lte: todayEnd },
        },
        include: { category: true },
        orderBy: { completedAt: "desc" },
      }),
      // Skipped today
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "SKIPPED",
          skippedAt: { gte: todayStart, lte: todayEnd },
        },
        include: { category: true },
        orderBy: { skippedAt: "desc" },
      }),
    ]);

    return success({
      overdue: overdue.map(toTask),
      today: todayTasks.map(toTask),
      undated: undated.map(toTask),
      completed: completed.map(toTask),
      skipped: skipped.map(toTask),
    });
  } catch (error) {
    console.error("getTodayTasks error:", error);
    return failure("タスクの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function getTasksByDate(
  input: GetTasksByDateInput
): Promise<ActionResult<DateTasks>> {
  try {
    const parsed = getTasksByDateSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { date } = parsed.data;
    const today = getTodayString();
    const isPast = date < today;
    const isFuture = date > today;
    const { start, end } = getDateRange(date);
    const targetDate = new Date(date);

    let completed: Task[] = [];
    let skipped: Task[] = [];

    // For past dates, get completed and skipped tasks
    if (isPast) {
      const [completedTasks, skippedTasks] = await Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "COMPLETED",
            completedAt: { gte: start, lte: end },
          },
          include: { category: true },
          orderBy: { completedAt: "desc" },
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "SKIPPED",
            skippedAt: { gte: start, lte: end },
          },
          include: { category: true },
          orderBy: { skippedAt: "desc" },
        }),
      ]);
      completed = completedTasks.map(toTask);
      skipped = skippedTasks.map(toTask);
    }

    // Get scheduled tasks for the date
    const scheduledTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return success({
      isPast,
      isFuture,
      completed,
      skipped,
      scheduled: scheduledTasks.map(toTask),
    });
  } catch (error) {
    console.error("getTasksByDate error:", error);
    return failure("タスクの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function searchTasks(
  input: SearchTasksInput
): Promise<ActionResult<SearchTasksResult>> {
  try {
    const parsed = searchTasksSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { keyword, status, categoryId, priority, dateFrom, dateTo } = parsed.data;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: user.id };

    // Keyword search
    if (keyword && keyword.trim()) {
      where.OR = [
        { title: { contains: keyword.trim(), mode: "insensitive" } },
        { memo: { contains: keyword.trim(), mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Category filter
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    // Priority filter
    if (priority !== undefined && priority !== "all") {
      where.priority = priority;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) {
        where.scheduledAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.scheduledAt.lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    });

    // Group by scheduled date
    const groupMap = new Map<string | null, Task[]>();
    for (const task of tasks) {
      const dateKey = task.scheduledAt
        ? task.scheduledAt.toISOString().split("T")[0]
        : null;
      const existing = groupMap.get(dateKey) || [];
      existing.push(toTask(task));
      groupMap.set(dateKey, existing);
    }

    // Sort groups: dated first (descending), then null
    const groups = Array.from(groupMap.entries())
      .sort((a, b) => {
        if (a[0] === null) return 1;
        if (b[0] === null) return -1;
        return b[0].localeCompare(a[0]);
      })
      .map(([date, tasks]) => ({ date, tasks }));

    return success({
      groups,
      total: tasks.length,
    });
  } catch (error) {
    console.error("searchTasks error:", error);
    return failure("検索に失敗しました", "INTERNAL_ERROR");
  }
}

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { title, scheduledAt, categoryId, priority, memo } = parsed.data;

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure("カテゴリが見つかりません", "NOT_FOUND");
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        memo: memo?.trim() || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        categoryId: categoryId || null,
        priority: priority || null,
        userId: user.id,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("createTask error:", error);
    return failure("タスクの作成に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, title, scheduledAt, categoryId, priority, memo } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure("カテゴリが見つかりません", "NOT_FOUND");
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (memo !== undefined) updateData.memo = memo?.trim() || null;
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (priority !== undefined) updateData.priority = priority;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("updateTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function completeTask(
  input: { id: string }
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        skippedAt: null,
        skipReason: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("completeTask error:", error);
    return failure("タスクの完了に失敗しました", "INTERNAL_ERROR");
  }
}

export async function uncompleteTask(
  input: { id: string }
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "PENDING",
        completedAt: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("uncompleteTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function skipTask(
  input: SkipTaskInput
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = skipTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, reason } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "SKIPPED",
        skippedAt: new Date(),
        skipReason: reason?.trim() || null,
        completedAt: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("skipTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function unskipTask(
  input: { id: string }
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "PENDING",
        skippedAt: null,
        skipReason: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("unskipTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function deleteTask(
  input: { id: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    await prisma.task.delete({ where: { id } });

    return success({ id });
  } catch (error) {
    console.error("deleteTask error:", error);
    return failure("タスクの削除に失敗しました", "INTERNAL_ERROR");
  }
}
