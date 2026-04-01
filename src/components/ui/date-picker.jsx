import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { RiCalendarLine } from "@remixicon/react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// value and onChange use "YYYY-MM-DD" string format
export function DatePicker({ value, onChange, placeholder = "Pick a date" }) {
  const [open, setOpen] = useState(false);

  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const validDate = date && isValid(date) ? date : undefined;

  return (
    <div className="space-y-2">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent",
          !validDate && "text-muted-foreground"
        )}
      >
        <RiCalendarLine className="h-4 w-4 shrink-0 text-muted-foreground" />
        {validDate ? format(validDate, "d MMM yyyy") : placeholder}
      </button>

      {/* Inline calendar */}
      {open && (
        <div className="rounded-md border bg-popover shadow-md">
          <Calendar
            mode="single"
            selected={validDate}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
}
