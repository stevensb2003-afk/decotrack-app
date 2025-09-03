
"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { TimeField } from "@/components/ui/time-field"
import { Time } from "@internationalized/date"
import type {TimeValue} from 'react-aria-components';

interface TimePickerProps {
  date: Date;
  setDate: (date: Date | null) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const timeValue = date ? new Time(date.getHours(), date.getMinutes()) : null;

  const onTimeChange = (newTime: TimeValue) => {
    const newDate = new Date(date.getTime());
    newDate.setHours(newTime.hour, newTime.minute);
    setDate(newDate);
  }

  return (
    <div className="flex flex-col gap-2">
      <TimeField
        aria-label="Time"
        value={timeValue}
        onChange={onTimeChange}
      />
    </div>
  )
}
