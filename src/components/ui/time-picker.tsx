
"use client"

import * as React from "react"
import { TimeField } from "@/components/ui/time-field"
import { Time, type TimeValue } from "@internationalized/date"

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const timeValue = React.useMemo(() => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return new Time(0, 0);
    }
    return new Time(date.getHours(), date.getMinutes());
  }, [date]);

  const onTimeChange = (newTime: TimeValue) => {
    if (!newTime) return;

    const newDate = new Date(date.getTime());
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
