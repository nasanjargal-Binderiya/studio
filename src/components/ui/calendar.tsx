
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayRender, type DayProps } from "react-day-picker" // Import DayProps
import { format, isValid } from 'date-fns'; // Import isValid

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"; // Keep Badge import
import { Button } from './button'; // Keep Button import

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    scheduledDatesWithCounts?: Record<string, number>; // Map of 'yyyy-MM-dd' to count
};

// Define the CustomDay component props more explicitly
// Use DayProps and add our custom prop
interface CustomDayProps extends DayProps {
    scheduledDatesWithCounts?: Record<string, number>;
}


// Define the CustomDay component
function CustomDay({ date, displayMonth, scheduledDatesWithCounts = {} }: CustomDayProps) {
    const ref = React.useRef<HTMLButtonElement | HTMLDivElement>(null); // Create a ref

    // Ensure day and displayMonth are valid Date objects before processing
    if (!isValid(date) || !isValid(displayMonth)) {
        // Handle invalid dates gracefully, maybe return a placeholder or null
        // Returning null might be simplest if invalid dates shouldn't be rendered
        console.warn("Rendering CustomDay with invalid date or displayMonth", { date, displayMonth });
        // Render a disabled placeholder or null
         return <div className={cn(
             buttonVariants({ variant: "ghost" }),
             "h-9 w-9 p-0 font-normal text-muted-foreground opacity-50" // Style similar to disabled day
         )}></div>;
    }

    // Call useDayRender inside the custom component, passing the ref
    const { buttonProps, dayProps: rdpDayProps, isButton, divProps } = useDayRender(date, displayMonth, ref);

    const dateString = format(date, 'yyyy-MM-dd');
    const count = scheduledDatesWithCounts[dateString];

    // Check if rdpDayProps and modifiers exist before accessing them
    const hasModifiers = rdpDayProps && rdpDayProps.modifiers;
    const isSelectedOrScheduled = hasModifiers && (rdpDayProps.modifiers.selected || rdpDayProps.modifiers.scheduled);


    // Render the default button or div with the badge if there's a count
    if (isButton) {
        return (
            <div className="relative">
                 {/* Attach ref and spread props */}
                <button ref={ref as React.RefObject<HTMLButtonElement>} {...buttonProps} {...rdpDayProps} />
                {count && count > 0 && (
                   <Badge
                      variant="secondary"
                      className={cn(
                        "absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full pointer-events-none",
                        // Make badge more prominent if the date is selected or scheduled
                        isSelectedOrScheduled && "bg-primary text-primary-foreground"
                      )}
                   >
                      {count}
                   </Badge>
                )}
            </div>
        );
    }
    // If not a button (e.g., outside day), render the div
    return (
        <div className="relative">
             {/* Attach ref and spread props */}
            <div ref={ref as React.RefObject<HTMLDivElement>} {...divProps} {...rdpDayProps} />
            {count && count > 0 && (
               <Badge
                  variant="secondary"
                  className={cn(
                    "absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full pointer-events-none",
                    isSelectedOrScheduled && "bg-primary text-primary-foreground"
                  )}
               >
                  {count}
               </Badge>
            )}
        </div>
    );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  scheduledDatesWithCounts = {}, // Default to empty object
  ...props
}: CalendarProps) {

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
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground", // Added opacity-50 for outside days
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
        // Pass only necessary props to CustomDay explicitly
        Day: (dayProps: DayProps) => (
           <CustomDay
             {...dayProps} // Pass all props from DayProps
             scheduledDatesWithCounts={scheduledDatesWithCounts}
           />
         ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

// Keep Badge and Button exports if needed elsewhere, but they are standard UI components
export { Calendar };

