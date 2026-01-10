"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header, DateNavigation, CategoryFilter } from "@/components/layout";
import {
  TaskSection,
  TaskInput,
  TaskEditDialog,
  SkipReasonDialog,
  type TaskEditData,
} from "@/components/task";
import { CalendarDialog } from "@/components/calendar";
import {
  useDateTasks,
  useTaskMutations,
  useSettings,
  useCategories,
} from "@/hooks";
import type { Task } from "@/types";
import { formatDateForDisplay, formatDateToJST } from "@/lib/dateUtils";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatDateToJST(date);
}

export default function DatePage() {
  const params = useParams();
  const router = useRouter();
  const dateParam = params.date as string;

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { settings } = useSettings();
  const { data: tasks, isLoading, error } = useDateTasks(dateParam);
  const { data: categories = [] } = useCategories();
  const mutations = useTaskMutations();

  const today = getTodayString();
  const isToday = dateParam === today;
  const isPast = dateParam < today;
  const isFuture = dateParam > today;

  // If it's today, redirect to home
  if (isToday) {
    router.replace("/");
    return null;
  }

  const handleNavigate = (newDate: string) => {
    if (newDate === today) {
      router.push("/");
    } else {
      router.push(`/date/${newDate}`);
    }
  };

  const handlePrevious = () => {
    handleNavigate(addDays(dateParam, -1));
  };

  const handleNext = () => {
    handleNavigate(addDays(dateParam, 1));
  };

  const handleToday = () => {
    router.push("/");
  };

  const handleDatePicker = () => {
    setDatePickerOpen(true);
  };

  const handleCreateTask = (data: {
    title: string;
    scheduledAt?: string;
    categoryId?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    memo?: string;
  }) => {
    mutations.createTask.mutate(data);
  };

  const handleComplete = (id: string) => {
    mutations.completeTask.mutate(id);
  };

  const handleUncomplete = (id: string) => {
    mutations.uncompleteTask.mutate(id);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskWithDetails = async (data: TaskEditData) => {
    try {
      await mutations.updateTask.mutateAsync(data);
      setEditingTask(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = (id: string) => {
    const task = [
      ...(tasks?.scheduled || []),
      ...(tasks?.completed || []),
      ...(tasks?.skipped || []),
    ].find((t) => t.id === id);
    if (task) {
      setSkippingTask(task);
    }
  };

  const handleSkipConfirm = (reason?: string) => {
    if (skippingTask) {
      mutations.skipTask.mutate({ id: skippingTask.id, reason });
      setSkippingTask(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      mutations.deleteTask.mutate(id);
    }
  };

  const filterTasksByCategory = (taskList: Task[]): Task[] => {
    if (selectedCategoryId === null) return taskList;
    if (selectedCategoryId === "none") {
      return taskList.filter((task) => !task.categoryId);
    }
    return taskList.filter((task) => task.categoryId === selectedCategoryId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-screen">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-screen">
          <div className="text-destructive">
            エラーが発生しました: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks
    ? {
        scheduled: filterTasksByCategory(tasks.scheduled),
        completed: filterTasksByCategory(tasks.completed),
        skipped: filterTasksByCategory(tasks.skipped),
      }
    : null;

  const hasNoTasks =
    !filteredTasks ||
    (filteredTasks.scheduled.length === 0 &&
      filteredTasks.completed.length === 0 &&
      filteredTasks.skipped.length === 0);

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <DateNavigation
          currentDate={new Date(dateParam + "T00:00:00")}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onDatePicker={handleDatePicker}
        />

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <main className="flex-1 overflow-auto pb-20 md:pb-4">
          <div className="px-4 py-4">
          {/* Date title */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold">
              {formatDateForDisplay(new Date(dateParam + "T00:00:00"))}
            </span>
            {isPast && (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                過去
              </span>
            )}
            {isFuture && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                未来
              </span>
            )}
          </div>

          {hasNoTasks ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>この日のタスクはありません</p>
              {isFuture && (
                <p className="text-sm mt-1">
                  下の入力欄から新しいタスクを追加できます
                </p>
              )}
              {isPast && (
                <p className="text-sm mt-1">
                  過去の日付にはタスクを追加できません
                </p>
              )}
            </div>
          ) : (
            <>
              {/* For past dates */}
              {isPast && (
                <>
                  {/* Completed on this day */}
                  <TaskSection
                    title="この日に完了"
                    tasks={filteredTasks?.completed || []}
                    variant="completed"
                    defaultCollapsed={settings.autoCollapseCompleted}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onEdit={handleEdit}
                    onSkip={handleSkip}
                    onDelete={handleDelete}
                  />

                  {/* Skipped on this day */}
                  <TaskSection
                    title="この日にやらない"
                    tasks={filteredTasks?.skipped || []}
                    variant="skipped"
                    defaultCollapsed={settings.autoCollapseSkipped}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onEdit={handleEdit}
                    onSkip={handleSkip}
                    onDelete={handleDelete}
                  />

                  {/* Scheduled for this day */}
                  <TaskSection
                    title="この日が予定日"
                    tasks={filteredTasks?.scheduled || []}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    onEdit={handleEdit}
                    onSkip={handleSkip}
                    onDelete={handleDelete}
                    showScheduledDate
                  />
                </>
              )}

              {/* For future dates */}
              {isFuture && (
                <TaskSection
                  title="予定タスク"
                  tasks={filteredTasks?.scheduled || []}
                  onComplete={handleComplete}
                  onUncomplete={handleUncomplete}
                  onEdit={handleEdit}
                  onSkip={handleSkip}
                  onDelete={handleDelete}
                />
              )}
              </>
            )}
          </div>
        </main>

        {/* Task input - only for future dates */}
        {isFuture && (
          <TaskInput
            onSubmit={handleCreateTask}
            categories={categories}
            defaultDate={dateParam}
            isLoading={mutations.createTask.isPending}
          />
        )}

        {/* No input for past dates */}
        {isPast && (
          <div className="sticky bottom-0 bg-muted/50 border-t p-4 text-center text-sm text-muted-foreground">
            過去の日付にはタスクを追加できません
          </div>
        )}
      </div>

      <TaskEditDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
        isLoading={mutations.updateTask.isPending}
      />

      <SkipReasonDialog
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={mutations.skipTask.isPending}
      />

      {/* Calendar dialog */}
      <CalendarDialog
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        currentDate={new Date(dateParam + "T00:00:00")}
        onSelectDate={handleNavigate}
      />
    </div>
  );
}
