
"use client"

import * as React from "react"
import {
  TimeField as AriaTimeField,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
  ValidationResult,
} from "react-aria-components"
import { Label, Input } from "react-aria-components";

interface TimePickerProps extends AriaTimeFieldProps<TimeValue> {
  label?: string
}

function TimePicker({ label, ...props }: TimePickerProps) {
  return (
    <AriaTimeField {...props} className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
    </AriaTimeField>
  );
}

export { TimePicker }
