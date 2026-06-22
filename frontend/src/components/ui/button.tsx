import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-base text-white hover:bg-brand-dark",
        outline:
          "border-gray-300 bg-white text-gray-700 hover:bg-gray-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-gray-200",
        ghost: "hover:bg-gray-200 hover:text-gray-800",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-brand-base underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 px-4 text-base [&_svg:not([class*='size-'])]:size-[18px]",
        sm: "h-9 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-4 text-base [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "size-9",
        xs: "h-9 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-[18px]",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
