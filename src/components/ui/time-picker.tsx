
"use client"

import * as React from "react"
import { TimeField } from "@/components/ui/time-field"
import { type TimeValue } from "react-aria-components"

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <TimeField
        aria-label="Time"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
