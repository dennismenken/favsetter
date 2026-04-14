import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-2 aria-invalid:ring-destructive/50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary — electric cyan, the headline action
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_0_0_oklch(1_0_0/_0.18)_inset,0_8px_24px_-8px_oklch(0.82_0.16_200/_0.55)] hover:brightness-110 hover:shadow-[0_1px_0_0_oklch(1_0_0/_0.22)_inset,0_10px_32px_-8px_oklch(0.82_0.16_200/_0.7)]",
        destructive:
          "bg-destructive text-white shadow-[0_8px_24px_-8px_oklch(0.68_0.24_18/_0.55)] hover:brightness-110 focus-visible:ring-destructive/50",
        outline:
          "border border-[oklch(1_0_0/_0.14)] bg-[oklch(1_0_0/_0.04)] text-foreground backdrop-blur-md hover:bg-[oklch(1_0_0/_0.08)] hover:border-[oklch(0.82_0.16_200/_0.45)] hover:text-foreground hover:shadow-[0_0_24px_-6px_oklch(0.82_0.16_200/_0.35)]",
        secondary:
          "bg-secondary text-secondary-foreground border border-[oklch(1_0_0/_0.06)] hover:bg-[oklch(1_0_0/_0.08)]",
        ghost:
          "text-foreground/80 hover:bg-[oklch(1_0_0/_0.06)] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Hot magenta — secondary signature accent (use sparingly)
        magenta:
          "bg-[oklch(0.68_0.27_350)] text-white shadow-[0_1px_0_0_oklch(1_0_0/_0.18)_inset,0_8px_24px_-8px_oklch(0.68_0.27_350/_0.6)] hover:brightness-110 hover:shadow-[0_1px_0_0_oklch(1_0_0/_0.22)_inset,0_10px_32px_-8px_oklch(0.68_0.27_350/_0.75)]",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-lg px-7 has-[>svg]:px-5 text-[0.95rem]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
