"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMonthlyTaskStats } from "@/hooks";
import type { DayTaskStats } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onSelectDate: (date: string) => void;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add empty cells for days before the first day of the month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(new Date(0)); // Placeholder for empty cells
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
}

function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DateCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  stats?: DayTaskStats;
  onClick: () => void;
}

function DateCell({ date, isToday, isSelected, stats, onClick }: DateCellProps) {
  const isEmpty = date.getTime() === 0;

  if (isEmpty) {
    return <div className="aspect-square" />;
  }

  const hasStats = stats && stats.total > 0;

  const cellContent = (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square p-1 rounded-lg transition-colors flex flex-col items-center justify-center relative w-full",
        "hover:bg-accent",
        isToday && "bg-primary/10 font-bold",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        !hasStats && "text-muted-foreground"
      )}
    >
      <span className="text-sm">{date.getDate()}</span>
      {hasStats && (
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <div className="text-xs">
            {stats.completed}/{stats.total}
          </div>
          <div className="flex gap-1">
            {stats.overdue > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
            {stats.skipped > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            )}
          </div>
        </div>
      )}
    </button>
  );

  if (!hasStats) {
    return cellContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {cellContent}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm space-y-1">
          <div>予定: {stats.total}件</div>
          <div>完了: {stats.completed}件</div>
          {stats.overdue > 0 && (
            <div className="text-red-500">期限超過: {stats.overdue}件</div>
          )}
          {stats.skipped > 0 && (
            <div className="text-gray-500">スキップ: {stats.skipped}件</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarDialog({
  open,
  onOpenChange,
  currentDate,
  onSelectDate,
}: CalendarDialogProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const monthString = getMonthString(viewDate);
  const { data: stats } = useMonthlyTaskStats(monthString);

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  const handlePrevMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  const handleSelectDate = (date: Date) => {
    const dateString = formatDateToString(date);
    onSelectDate(dateString);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="前月"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span>{formatMonthYear(viewDate)}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              aria-label="次月"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <TooltipProvider>
          <div className="py-4">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const dateString = formatDateToString(date);
                return (
                  <DateCell
                    key={index}
                    date={date}
                    isToday={isToday(date)}
                    isSelected={isSameDate(date, currentDate)}
                    stats={stats?.[dateString]}
                    onClick={() => handleSelectDate(date)}
                  />
                );
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Footer */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleToday}>
            今日
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
