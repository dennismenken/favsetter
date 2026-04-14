import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/30 selection:text-foreground",
        "flex h-10 w-full min-w-0 rounded-lg border border-[oklch(1_0_0/_0.10)] bg-[oklch(1_0_0/_0.03)] px-3.5 py-2 text-sm shadow-[inset_0_1px_0_0_oklch(1_0_0/_0.04)] outline-none",
        "transition-[color,background-color,border-color,box-shadow] duration-200",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-[oklch(1_0_0/_0.16)]",
        "focus-visible:border-[oklch(0.82_0.16_200/_0.6)] focus-visible:bg-[oklch(1_0_0/_0.05)] focus-visible:shadow-[inset_0_1px_0_0_oklch(1_0_0/_0.06),0_0_0_4px_oklch(0.82_0.16_200/_0.18),0_0_24px_-6px_oklch(0.82_0.16_200/_0.4)]",
        "aria-invalid:border-destructive/70 aria-invalid:focus-visible:shadow-[0_0_0_4px_oklch(0.68_0.24_18/_0.18)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
