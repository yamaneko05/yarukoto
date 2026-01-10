import type { Priority, TaskStatus } from "@/generated/prisma/client";

export type { Priority, TaskStatus } from "@/generated/prisma/client";

export type CategorySummary = {
  id: string;
  name: string;
  color: string | null;
};

export type Task = {
  id: string;
  title: string;
  memo: string | null;
  status: TaskStatus;
  priority: Priority | null;
  scheduledAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  skipReason: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: CategorySummary | null;
};

export type TodayTasks = {
  overdue: Task[];
  today: Task[];
  undated: Task[];
  completed: Task[];
  skipped: Task[];
};

export type DateTasks = {
  isPast: boolean;
  isFuture: boolean;
  completed: Task[];
  skipped: Task[];
  scheduled: Task[];
};

export type TaskGroup = {
  date: string | null;
  tasks: Task[];
};

export type SearchTasksResult = {
  groups: TaskGroup[];
  total: number;
};

export type DayTaskStats = {
  total: number;
  completed: number;
  overdue: number;
  skipped: number;
};

export type MonthlyTaskStats = {
  [date: string]: DayTaskStats;
};
