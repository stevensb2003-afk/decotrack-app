
"use client"

import {
  DateInput as AriaDateInput,
  DateInputProps,
} from "react-aria-components"
import { DateSegment } from "./date-segment"
import { cn } from "@/lib/utils"

function DateInput({ className, ...props }: DateInputProps) {
  return (
    <AriaDateInput
      className={(values) =>
        cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "group flex min-w-[8rem] items-center gap-x-1 disabled:cursor-not-allowed disabled:opacity-50",
          typeof className === "function" ? className(values) : className
        )
      }
      {...props}
    >
      {(segment) => <DateSegment segment={segment} />}
    </AriaDateInput>
  )
}

export { DateInput }

