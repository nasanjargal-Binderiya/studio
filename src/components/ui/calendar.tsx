
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayRender } from "react-day-picker"
import { format, isValid } from 'date-fns'; // Import isValid

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    scheduledDatesWithCounts?: Record<string, number>; // Map of 'yyyy-MM-dd' to count
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  scheduledDatesWithCounts = {}, // Default to empty object
  ...props
}: CalendarProps) {

  const renderDay = (day: Date, _selectedDate: Date | undefined, dayPickerProps: Parameters<typeof useDayRender>[2]) => {
     // Ensure day is a valid Date object before formatting
     if (!isValid(day)) {
         // Return the default rendering or null if the date is invalid
         const { DayButton } = useDayRender(day, _selectedDate, dayPickerProps);
         return <DayButton />; // Or return null if you prefer to hide invalid days entirely
     }

     const dateString = format(day, 'yyyy-MM-dd');
     const count = scheduledDatesWithCounts[dateString];

     // Use the default Day component from react-day-picker
     const { DayButton } = useDayRender(day, _selectedDate, dayPickerProps);

      return (
        <div className="relative">
             <DayButton />
             {count && count > 0 && (
                <Badge
                   variant="secondary"
                   className={cn(
                     "absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full pointer-events-none",
                     // Make badge more prominent if the date is selected or scheduled
                     (dayPickerProps.modifiers.selected || dayPickerProps.modifiers.scheduled) && "bg-primary text-primary-foreground"
                   )}
                >
                   {count}
                </Badge>
             )}
        </div>
     );
   };


  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative" // Added relative positioning for badge
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
         // Use the custom Day component wrapper
         Day: renderDay,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

// We need to export Badge from here if Calendar uses it internally
// and Calendar is imported elsewhere. Alternatively, ensure Badge
// is imported where Calendar is used. Let's re-export for simplicity.
import { Badge } from "@/components/ui/badge";
import { Button } from './button'; // Import Button for the footer
export { Calendar };

