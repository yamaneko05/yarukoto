"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchFiltersComponent, SearchResults } from "@/components/search";
import { TaskEditDialog, type TaskEditData } from "@/components/task";
import {
  useSearchTasks,
  useCategories,
  useUpdateTask,
  useCompleteTask,
  useUncompleteTask,
  useSkipTask,
  useDeleteTask,
  useInvalidateSearchTasks,
  type SearchFilters,
} from "@/hooks";
import type { Task } from "@/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    status: "all",
    categoryId: undefined,
    priority: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: categories = [] } = useCategories();
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useSearchTasks(filters);

  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const skipTask = useSkipTask();
  const deleteTask = useDeleteTask();
  const invalidateSearch = useInvalidateSearchTasks();

  const hasSearchCriteria =
    filters.keyword.trim() !== "" ||
    filters.status !== "all" ||
    filters.categoryId !== undefined ||
    filters.priority !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined;

  const handleComplete = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: invalidateSearch,
    });
  };

  const handleUncomplete = (id: string) => {
    uncompleteTask.mutate(id, {
      onSuccess: invalidateSearch,
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskWithDetails = async (data: TaskEditData) => {
    try {
      await updateTask.mutateAsync(data);
      invalidateSearch();
      setEditingTask(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = (id: string) => {
    skipTask.mutate(
      { id },
      {
        onSuccess: invalidateSearch,
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      deleteTask.mutate(id, {
        onSuccess: invalidateSearch,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-2 text-lg font-semibold">タスク検索</h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="px-4 py-4 space-y-6">
          {/* Search Filters */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <SearchFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />
          </div>

          {/* Search Results */}
          <SearchResults
            groups={searchResults?.groups || []}
            total={searchResults?.total || 0}
            isLoading={isLoading || isFetching}
            hasSearchCriteria={hasSearchCriteria}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onEdit={handleEdit}
            onSkip={handleSkip}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {/* Edit Dialog */}
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
