"use client";

import { TaskCard } from "@/components/task";
import { cn } from "@/lib/utils";
import type { Task, TaskGroup } from "@/types";

type SearchResultsProps = {
  groups: TaskGroup[];
  total: number;
  isLoading: boolean;
  hasSearchCriteria: boolean;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return "日付未定";

  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Format: 2024年1月15日（月）
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  };
  const formatted = date.toLocaleDateString("ja-JP", options);

  // Add relative label
  if (date.getTime() === today.getTime()) {
    return `${formatted} - 今日`;
  }
  if (date.getTime() === tomorrow.getTime()) {
    return `${formatted} - 明日`;
  }
  if (date.getTime() === yesterday.getTime()) {
    return `${formatted} - 昨日`;
  }

  return formatted;
}

export function SearchResults({
  groups,
  total,
  isLoading,
  hasSearchCriteria,
  onComplete,
  onUncomplete,
  onEdit,
  onSkip,
  onDelete,
}: SearchResultsProps) {
  if (!hasSearchCriteria) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>検索条件を入力してください</p>
        <p className="text-sm mt-1">
          キーワード、ステータス、カテゴリなどで絞り込みできます
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">検索中...</div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>該当するタスクがありません</p>
        <p className="text-sm mt-1">検索条件を変更してみてください</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        検索結果: {total}件
      </div>

      {/* Grouped results */}
      {groups.map((group) => (
        <div key={group.date ?? "undated"} className="space-y-2">
          {/* Date header */}
          <div
            className={cn(
              "flex items-center gap-2 py-2 border-b",
              group.date === null && "text-muted-foreground"
            )}
          >
            <span className="text-sm font-medium">
              {formatDateLabel(group.date)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({group.tasks.length})
            </span>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
                onEdit={onEdit}
                onSkip={onSkip}
                onDelete={onDelete}
                showScheduledDate={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
