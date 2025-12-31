"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Send, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskInputProps {
  onSubmit: (title: string, scheduledAt?: string) => void;
  onOpenDetailDialog?: () => void;
  defaultDate?: string;
  isLoading?: boolean;
  placeholder?: string;
}

export function TaskInput({
  onSubmit,
  onOpenDetailDialog,
  defaultDate,
  isLoading = false,
  placeholder = "新しいタスクを入力...",
}: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultDate) {
      setScheduledAt(defaultDate);
    }
  }, [defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit(title.trim(), scheduledAt || undefined);
    setTitle("");
    // Keep focus for continuous input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSubmit(e);
    }
  };

  const handleDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-background border-t p-3"
    >
      <div className="flex items-center gap-2">
        {onOpenDetailDialog && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenDetailDialog}
            aria-label="詳細入力でタスクを作成"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={handleDateClick}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded",
              scheduledAt ? "text-primary" : "text-muted-foreground",
            )}
            aria-label="日付を選択"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="sr-only"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!title.trim() || isLoading}
          aria-label="タスクを追加"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {scheduledAt && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            予定日: {scheduledAt.replace(/-/g, "/")}
          </span>
          <button
            type="button"
            onClick={() => setScheduledAt("")}
            className="text-xs text-destructive hover:underline"
          >
            クリア
          </button>
        </div>
      )}
    </form>
  );
}
