
"use client"

import {
  DateSegment as AriaDateSegment,
  DateSegmentProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

function DateSegment({ segment, ...props }: DateSegmentProps) {
  return (
    <AriaDateSegment
      className={(values) =>
        cn(
          "focus:bg-accent focus:text-accent-foreground group-disabled:cursor-not-allowed group-disabled:opacity-50",
          "type-literal:px-0.5",
          "rounded-md caret-transparent outline-none focus:outline-none",
          "aria-[placeholder]:text-muted-foreground",
          typeof segment.className === "function"
            ? segment.className(values)
            : segment.className
        )
      }
      {...segment}
      {...props}
    />
  )
}

export { DateSegment }
