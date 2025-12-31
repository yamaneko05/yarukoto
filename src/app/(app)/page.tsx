"use client";

import { useState } from "react";
import { Header } from "@/components/layout";
import {
  TaskSection,
  TaskInput,
  TaskCreateDialog,
  TaskEditDialog,
  type TaskCreateData,
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

export default function HomePage() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { settings } = useSettings();
  const { data: tasks, isLoading, error } = useTodayTasks();
  const { data: categories = [] } = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const skipTask = useSkipTask();
  const deleteTask = useDeleteTask();

  const handleCreateTask = (title: string, scheduledAt?: string) => {
    createTask.mutate({ title, scheduledAt });
  };

  const handleCreateTaskWithDetails = async (data: TaskCreateData) => {
    try {
      await createTask.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch {
      // Error is handled by the mutation
    }
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
    // TODO: Show skip reason dialog
    skipTask.mutate({ id });
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      deleteTask.mutate(id);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-destructive">
            エラーが発生しました: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const hasNoTasks =
    !tasks ||
    (tasks.overdue.length === 0 &&
      tasks.today.length === 0 &&
      tasks.undated.length === 0 &&
      tasks.completed.length === 0 &&
      tasks.skipped.length === 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 overflow-auto pb-20">
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
                tasks={tasks?.overdue || []}
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
                tasks={tasks?.today || []}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />

              {/* Undated tasks */}
              <TaskSection
                title="日付未定"
                tasks={tasks?.undated || []}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />

              {/* Completed tasks */}
              <TaskSection
                title="今日完了"
                tasks={tasks?.completed || []}
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
                tasks={tasks?.skipped || []}
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
        onOpenDetailDialog={() => setIsCreateDialogOpen(true)}
        defaultDate={today}
        isLoading={createTask.isPending}
      />

      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateTaskWithDetails}
        categories={categories}
        defaultDate={today}
        isLoading={createTask.isPending}
      />

      <TaskEditDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
        isLoading={updateTask.isPending}
      />
    </div>
  );
}
