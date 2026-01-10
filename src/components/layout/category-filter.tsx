"use client";

import type { Category } from "@/types";
import { CategoryChip } from "./category-chip";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="px-4 py-2 overflow-x-auto bg-muted/20 border-b">
      <div className="flex gap-2 min-w-max">
        <CategoryChip
          label="すべて"
          active={selectedCategoryId === null}
          onClick={() => onSelectCategory(null)}
          isSpecial
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            color={category.color}
            active={selectedCategoryId === category.id}
            onClick={() => onSelectCategory(category.id)}
          />
        ))}
        <CategoryChip
          label="カテゴリなし"
          active={selectedCategoryId === "none"}
          onClick={() => onSelectCategory("none")}
          isSpecial
        />
      </div>
    </div>
  );
}
