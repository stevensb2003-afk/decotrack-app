
"use client"

import * as React from "react"
import { TimeField, TimeFieldProps } from "@/components/ui/time-field"
import { TimeValue } from "react-aria-components"
import { Label, Input } from "react-aria-components";

interface TimePickerProps extends TimeFieldProps<TimeValue> {
  label?: string
}

export function TimePicker({ label, ...props }: TimePickerProps) {
  return (
    <TimeField {...props}>
      <Label>{label}</Label>
      <Input />
    </TimeField>
  );
}
