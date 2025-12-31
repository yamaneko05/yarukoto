"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const PRIORITIES = [
  { value: "none", label: "なし" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
] as const;

export interface TaskCreateData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  memo?: string;
}

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskCreateData) => void;
  categories: Category[];
  defaultDate?: string;
  isLoading?: boolean;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  onSave,
  categories,
  defaultDate,
  isLoading = false,
}: TaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [priority, setPriority] = useState<string>("none");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setScheduledAt(defaultDate || "");
      setCategoryId("none");
      setPriority("none");
      setMemo("");
      setError(null);
    }
  }, [open, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("タスク名を入力してください");
      return;
    }

    onSave({
      title: trimmedTitle,
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId !== "none" ? categoryId : undefined,
      priority:
        priority !== "none"
          ? (priority as "HIGH" | "MEDIUM" | "LOW")
          : undefined,
      memo: memo.trim() || undefined,
    });
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいタスク</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* タスク名 */}
          <div className="space-y-2">
            <Label htmlFor="task-title">
              タスク名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="タスクの内容"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* 予定日 */}
          <div className="space-y-2">
            <Label htmlFor="task-date">予定日</Label>
            <div className="flex gap-2">
              <Input
                id="task-date"
                type="date"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex-1"
              />
              {scheduledAt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduledAt("")}
                >
                  クリア
                </Button>
              )}
            </div>
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue>
                  {categoryId === "none" ? (
                    <span className="text-muted-foreground">なし</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: selectedCategory?.color || "#6B7280",
                        }}
                      />
                      <span>{selectedCategory?.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: category.color || "#6B7280",
                        }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 優先度 */}
          <div className="space-y-2">
            <Label>優先度</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors",
                    priority === p.value
                      ? p.value === "HIGH"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : p.value === "MEDIUM"
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : p.value === "LOW"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-border"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="task-memo">メモ</Label>
            <Textarea
              id="task-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="タスクの詳細やメモ"
              rows={3}
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "作成中..." : "作成する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
