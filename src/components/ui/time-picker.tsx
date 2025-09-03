"use client"

import * as React from "react"
import {
  TimeField as AriaTimeField,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue,
} from "react-aria-components"
import { Label, Input } from "react-aria-components";
import { DateInput } from "./date-input";

interface TimePickerProps extends AriaTimeFieldProps<TimeValue> {
  label?: string;
}

function TimePicker({ label, ...props }: TimePickerProps) {
  return (
    <AriaTimeField {...props} className="flex flex-col gap-2">
       {label && <Label>{label}</Label>}
      <DateInput />
    </AriaTimeField>
  );
}

export { TimePicker }
