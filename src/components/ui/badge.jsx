import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        outline: "border border-border text-foreground",
        upcoming: "bg-blue-100 text-blue-700",
        completed: "bg-green-100 text-green-700",
        "no-show": "bg-red-100 text-red-700",
        cancelled: "bg-gray-100 text-gray-600",
        paid: "bg-green-100 text-green-700",
        pending: "bg-amber-100 text-amber-700",
        overdue: "bg-red-100 text-red-700",
        waived: "bg-gray-100 text-gray-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
