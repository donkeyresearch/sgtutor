import * as React from "react"
import { DayPicker } from "react-day-picker"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3 w-full",
        month_caption: "flex justify-center items-center h-9 mb-1",
        caption_label: "text-sm font-semibold",
        nav: "absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100 pointer-events-auto"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex mb-1",
        weekday: "text-muted-foreground w-9 text-center text-[0.8rem] font-normal",
        week: "flex w-full",
        day: "relative p-0 text-center",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-sm"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-40",
        disabled: "text-muted-foreground opacity-30",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left"
            ? <RiArrowLeftSLine className="h-4 w-4" />
            : <RiArrowRightSLine className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

export { Calendar }
