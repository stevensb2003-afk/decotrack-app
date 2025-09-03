
"use client"

import * as React from "react"
import {
  TimeField as AriaTimeField,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
  ValidationResult,
} from "react-aria-components"
import { DateInput } from "./date-input"

interface TimeFieldProps<T extends TimeValue>
  extends AriaTimeFieldProps<T> {
  errorMessage?: string | ((validation: ValidationResult) => string)
}

function TimeField<T extends TimeValue>({
  className,
  ...props
}: TimeFieldProps<T>) {
  return (
    <AriaTimeField
      className="flex flex-col items-start"
      {...props}
    >
      <DateInput className={className} />
    </AriaTimeField>
  )
}

export { TimeField }

