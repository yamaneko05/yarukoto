"use client";

import { Search, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types";
import type { SearchFilters } from "@/hooks";

type SearchFiltersProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: Category[];
};

export function SearchFiltersComponent({
  filters,
  onFiltersChange,
  categories,
}: SearchFiltersProps) {
  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      keyword: "",
      status: "all",
      categoryId: undefined,
      priority: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.keyword.trim() !== "" ||
    filters.status !== "all" ||
    filters.categoryId !== undefined ||
    filters.priority !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined;

  return (
    <div className="space-y-4">
      {/* Keyword Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="キーワードを入力..."
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.keyword && (
          <button
            type="button"
            onClick={() => updateFilter("keyword", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          ステータス
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "すべて" },
            { value: "pending", label: "未完了" },
            { value: "completed", label: "完了" },
            { value: "skipped", label: "やらない" },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filters.status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateFilter(
                  "status",
                  option.value as SearchFilters["status"]
                )
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category & Priority Filters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            カテゴリ
          </label>
          <Select
            value={
              filters.categoryId === null
                ? "none"
                : filters.categoryId ?? "all"
            }
            onValueChange={(value) => {
              if (value === "all") {
                updateFilter("categoryId", undefined);
              } else if (value === "none") {
                updateFilter("categoryId", null);
              } else {
                updateFilter("categoryId", value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="none">カテゴリなし</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: category.color || "#6B7280" }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            優先度
          </label>
          <Select
            value={
              filters.priority === null
                ? "none"
                : filters.priority ?? "all"
            }
            onValueChange={(value) => {
              if (value === "all") {
                updateFilter("priority", undefined);
              } else if (value === "none") {
                updateFilter("priority", null);
              } else {
                updateFilter("priority", value as "HIGH" | "MEDIUM" | "LOW");
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="none">優先度なし</SelectItem>
              <SelectItem value="HIGH">高</SelectItem>
              <SelectItem value="MEDIUM">中</SelectItem>
              <SelectItem value="LOW">低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Calendar className="size-4" />
          期間（予定日）
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) =>
              updateFilter("dateFrom", e.target.value || undefined)
            }
            className="flex-1"
          />
          <span className="text-muted-foreground">〜</span>
          <Input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) =>
              updateFilter("dateTo", e.target.value || undefined)
            }
            className="flex-1"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full text-muted-foreground"
        >
          <X className="size-4 mr-1" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
}
