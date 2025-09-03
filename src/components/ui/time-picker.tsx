
"use client"

import * as React from "react"
import { TimeField } from "@/components/ui/time-field"
import { Time, type TimeValue } from "@internationalized/date"

interface TimePickerProps {
  date: Date | null;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const timeValue = React.useMemo(() => {
    if (!date) return null;
    return new Time(date.getHours(), date.getMinutes());
  }, [date]);

  const onTimeChange = (newTime: TimeValue | null) => {
    if (!newTime) return;

    const newDate = date ? new Date(date.getTime()) : new Date();
    newDate.setHours(newTime.hour, newTime.minute);
    setDate(newDate);
  };

  return (
    <div className="flex flex-col gap-2">
      <TimeField
        aria-label="Time"
        value={timeValue}
        onChange={onTimeChange}
      />
    </div>
  );
}
