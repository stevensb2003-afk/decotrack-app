
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { format } from "date-fns"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
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
        caption_label: "text-sm font-medium hidden",
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
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Caption: CustomCaption,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

function CustomCaption(props: React.ComponentProps<typeof DayPicker>['components']['Caption']) {
    const { goToMonth, nextMonth, previousMonth } = useNavigation();
    const { fromYear, toYear } = useDayPicker();

    const handleYearChange = (newValue: string) => {
        const newDate = new Date(props.displayMonth);
        newDate.setFullYear(parseInt(newValue));
        goToMonth(newDate);
    }
    
    const years = [];
    const startYear = fromYear || (new Date().getFullYear() - 100);
    const endYear = toYear || (new Date().getFullYear());

    for (let i = startYear; i <= endYear; i++) {
        years.push(i);
    }

    return (
      <div className="flex items-center justify-between w-full">
        <Button
            disabled={!previousMonth}
            onClick={() => previousMonth && goToMonth(previousMonth)}
            variant="outline"
            className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
                {format(props.displayMonth, 'MMMM')}
            </span>
            <Select
                onValueChange={handleYearChange}
                value={props.displayMonth.getFullYear().toString()}
            >
                <SelectTrigger className="w-[80px] h-7 text-sm">
                    <SelectValue>{props.displayMonth.getFullYear()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button
            disabled={!nextMonth}
            onClick={() => nextMonth && goToMonth(nextMonth)}
            variant="outline"
            className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
}

export { Calendar }
