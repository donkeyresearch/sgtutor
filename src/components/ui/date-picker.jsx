import { format, parse, isValid } from "date-fns";
import { RiCalendarLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// value and onChange use "YYYY-MM-DD" string format
export function DatePicker({ value, onChange, placeholder = "Pick a date" }) {
  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const validDate = date && isValid(date) ? date : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !validDate && "text-muted-foreground")}
        >
          <RiCalendarLine className="h-4 w-4 mr-2 shrink-0" />
          {validDate ? format(validDate, "d MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Calendar
          mode="single"
          selected={validDate}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
