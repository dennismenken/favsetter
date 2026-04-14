"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!bg-[oklch(0.23_0.05_265/_0.92)] !text-foreground !border !border-[oklch(1_0_0/_0.10)] !backdrop-blur-md !shadow-[0_12px_40px_-16px_oklch(0_0_0/_0.7)] !rounded-lg",
          title: "!font-semibold !tracking-tight",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-secondary !text-secondary-foreground",
          success:
            "!border-[oklch(0.82_0.16_200/_0.45)] [&_[data-icon]]:!text-[oklch(0.82_0.16_200)]",
          error:
            "!border-[oklch(0.68_0.27_350/_0.45)] [&_[data-icon]]:!text-[oklch(0.68_0.27_350)]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
