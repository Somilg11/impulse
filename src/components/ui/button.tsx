import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Generous radius, medium weight, and a barely-there compression on press -
  // the three things that make a control feel like a system control rather than
  // an HTML button.
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-medium outline-none transition-[background-color,color,opacity,transform] duration-[--duration-fast] ease-[--ease-ios] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-2 focus-visible:ring-brand/50",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-line bg-surface-raised text-zinc-200 hover:bg-surface-hover",
        secondary:
          "bg-surface-hover text-zinc-200 hover:bg-surface-hover/80",
        ghost:
          "text-zinc-400 hover:bg-surface-hover hover:text-zinc-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-[12.5px] has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 text-[14px] has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
