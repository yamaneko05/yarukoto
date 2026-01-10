"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, DateNavigation, CategoryFilter } from "@/components/layout";
import {
  TaskSection,
  TaskInput,
  TaskEditDialog,
  SkipReasonDialog,
  type TaskEditData,
} from "@/components/task";
import {
  useTodayTasks,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useUncompleteTask,
  useSkipTask,
  useDeleteTask,
  useSettings,
  useCategories,
} from "@/hooks";
import type { Task } from "@/types";
import { formatDateToJST } from "@/lib/dateUtils";

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return formatDateToJST(date);
}

export default function HomePage() {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { settings } = useSettings();
  const { data: tasks, isLoading, error } = useTodayTasks();
  const { data: categories = [] } = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const skipTask = useSkipTask();
  const deleteTask = useDeleteTask();

  const handleCreateTask = (data: {
    title: string;
    scheduledAt?: string;
    categoryId?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    memo?: string;
  }) => {
    createTask.mutate(data);
  };

  const handleComplete = (id: string) => {
    completeTask.mutate(id);
  };

  const handleUncomplete = (id: string) => {
    uncompleteTask.mutate(id);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskWithDetails = async (data: TaskEditData) => {
    try {
      await updateTask.mutateAsync(data);
      setEditingTask(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = (id: string) => {
    const task = [
      ...(tasks?.overdue || []),
      ...(tasks?.today || []),
      ...(tasks?.undated || []),
      ...(tasks?.completed || []),
      ...(tasks?.skipped || []),
    ].find((t) => t.id === id);
    if (task) {
      setSkippingTask(task);
    }
  };

  const handleSkipConfirm = (reason?: string) => {
    if (skippingTask) {
      skipTask.mutate({ id: skippingTask.id, reason });
      setSkippingTask(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      deleteTask.mutate(id);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleNavigate = (newDate: string) => {
    if (newDate === today) {
      return; // Already on home
    }
    router.push(`/date/${newDate}`);
  };

  const handlePrevious = () => {
    handleNavigate(addDays(today, -1));
  };

  const handleNext = () => {
    handleNavigate(addDays(today, 1));
  };

  const handleDatePicker = () => {
    setDatePickerOpen(true);
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
        overdue: filterTasksByCategory(tasks.overdue),
        today: filterTasksByCategory(tasks.today),
        undated: filterTasksByCategory(tasks.undated),
        completed: filterTasksByCategory(tasks.completed),
        skipped: filterTasksByCategory(tasks.skipped),
      }
    : null;

  const hasNoTasks =
    !filteredTasks ||
    (filteredTasks.overdue.length === 0 &&
      filteredTasks.today.length === 0 &&
      filteredTasks.undated.length === 0 &&
      filteredTasks.completed.length === 0 &&
      filteredTasks.skipped.length === 0);

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <DateNavigation
          currentDate={new Date()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={() => {}}
          onDatePicker={handleDatePicker}
        />

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <main className="flex-1 overflow-auto pb-20 md:pb-4">
          <div className="px-4 py-4">
          {/* Today badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold">今日のタスク</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              今日
            </span>
          </div>

          {hasNoTasks ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>タスクがありません</p>
              <p className="text-sm mt-1">
                下の入力欄から新しいタスクを追加しましょう
              </p>
            </div>
          ) : (
            <>
              {/* Overdue tasks */}
              <TaskSection
                title="期限超過"
                tasks={filteredTasks?.overdue || []}
                variant="overdue"
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
                showScheduledDate
              />

              {/* Today's tasks */}
              <TaskSection
                title="今日"
                tasks={filteredTasks?.today || []}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />

              {/* Undated tasks */}
              <TaskSection
                title="日付未定"
                tasks={filteredTasks?.undated || []}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />

              {/* Completed tasks */}
              <TaskSection
                title="今日完了"
                tasks={filteredTasks?.completed || []}
                variant="completed"
                defaultCollapsed={settings.autoCollapseCompleted}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />

              {/* Skipped tasks */}
              <TaskSection
                title="今日やらない"
                tasks={filteredTasks?.skipped || []}
                variant="skipped"
                defaultCollapsed={settings.autoCollapseSkipped}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />
              </>
          )}
          </div>
        </main>

        <TaskInput
          onSubmit={handleCreateTask}
          categories={categories}
          defaultDate={today}
          isLoading={createTask.isPending}
        />
      </div>

      <TaskEditDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
        isLoading={updateTask.isPending}
      />

      <SkipReasonDialog
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={skipTask.isPending}
      />

      {/* Date picker dialog */}
      {datePickerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setDatePickerOpen(false)}
        >
          <div
            className="bg-background p-4 rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="date"
              defaultValue={today}
              onChange={(e) => {
                if (e.target.value) {
                  handleNavigate(e.target.value);
                  setDatePickerOpen(false);
                }
              }}
              className="p-2 border rounded"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
