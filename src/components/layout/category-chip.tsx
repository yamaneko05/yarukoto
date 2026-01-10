"use client";

import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string | null;
  isSpecial?: boolean; // For "すべて" and "カテゴリなし"
}

export function CategoryChip({
  label,
  active,
  onClick,
  color,
  isSpecial = false,
}: CategoryChipProps) {
  // Special chips (すべて, カテゴリなし) - Gray style
  if (isSpecial) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "text-xs px-2 py-1 rounded whitespace-nowrap transition-all",
          active
            ? "bg-muted text-foreground font-semibold"
            : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
        )}
      >
        {label}
      </button>
    );
  }

  // Regular category chips - Same style as TaskCard
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-2 py-1 rounded whitespace-nowrap transition-all",
        active && "font-semibold"
      )}
      style={{
        backgroundColor: color ? `${color}20` : "hsl(var(--muted))",
        color: color || "hsl(var(--muted-foreground))",
        opacity: active ? 1 : 0.7,
      }}
    >
      🏷️ {label}
    </button>
  );
}
