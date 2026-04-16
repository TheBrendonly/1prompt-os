import * as React from "react";
import { useState, useCallback } from "react";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon } from "@/components/icons";
import { DateRange, DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useToast } from "@/hooks/use-toast";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  maxDays?: number;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  maxDays = 30,
  className,
}: DateRangePickerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | undefined>(undefined);

  React.useEffect(() => {
    if (!open) {
      setDraftStart(undefined);
      return;
    }

    if (startDate && !endDate) {
      setDraftStart(startDate);
      return;
    }

    setDraftStart(undefined);
  }, [open, startDate, endDate]);

  const selected: DateRange | undefined = draftStart
    ? { from: draftStart, to: undefined }
    : startDate || endDate
      ? { from: startDate, to: endDate }
      : undefined;

  const handleDayClick = useCallback(
    (day: Date, modifiers: { disabled?: boolean }) => {
      if (modifiers.disabled) return;

      // First click always becomes the new start date
      if (!draftStart) {
        setDraftStart(day);
        onRangeChange(day, undefined);
        return;
      }

      // Ignore duplicate click on the same start day
      if (day.getTime() === draftStart.getTime()) {
        return;
      }

      const from = day.getTime() < draftStart.getTime() ? day : draftStart;
      const to = day.getTime() < draftStart.getTime() ? draftStart : day;

      if (differenceInDays(to, from) > maxDays) {
        toast({
          title: "Date Range Too Large",
          description: `Please select a date range of ${maxDays} days or less.`,
          variant: "destructive",
        });
        onRangeChange(draftStart, undefined);
        return;
      }

      onRangeChange(from, to);
      setDraftStart(undefined);
      setTimeout(() => setOpen(false), 250);
    },
    [draftStart, onRangeChange, maxDays, toast]
  );

  const label = React.useMemo(() => {
    if (startDate && endDate) {
      return `${format(startDate, "MMM d, yyyy")} — ${format(endDate, "MMM d, yyyy")}`;
    }
    if (startDate) {
      return `${format(startDate, "MMM d, yyyy")} — select end`;
    }
    return "Pick date range";
  }, [startDate, endDate]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setDraftStart(undefined);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto min-w-[220px] justify-start text-left font-normal normal-case tracking-normal",
            !startDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="range"
          selected={selected}
          onDayClick={handleDayClick}
          numberOfMonths={2}
          disabled={(date) =>
            date > new Date() ||
            date < new Date("2020-01-01") ||
            date > new Date("2026-12-31")
          }
          showOutsideDays
          className={cn("p-3 pointer-events-auto")}
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "inline-flex items-center justify-center h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border text-foreground",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "h-9 w-9 text-center text-sm p-0 relative",
              "[&:has([aria-selected].day-range-end)]:rounded-r-md",
              "[&:has([aria-selected].day-outside)]:bg-accent/50",
              "[&:has([aria-selected])]:bg-accent",
              "first:[&:has([aria-selected])]:rounded-l-md",
              "last:[&:has([aria-selected])]:rounded-r-md",
              "focus-within:relative focus-within:z-20"
            ),
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 transition-colors duration-150"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-foreground/90 text-background hover:bg-foreground/90 hover:text-background focus:bg-foreground/90 focus:text-background",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ..._props }) => (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4h-2v2h-2v2h-2v2H8v4h2v2h2v2h2v2h2v-4h-2v-2h-2v-4h2V8h2V4z" />
              </svg>
            ),
            IconRight: ({ ..._props }) => (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 4h2v2h2v2h2v2h2v4h-2v2h-2v2h-2v2H8v-4h2v-2h2v-4h-2V8H8V4z" />
              </svg>
            ),
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
