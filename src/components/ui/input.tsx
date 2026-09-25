import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground selection:bg-brand/30 h-9 w-full min-w-0 rounded-lg border border-line bg-surface-raised px-3 py-1 text-[13px] text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // A border change rather than a 3px ring: rings stack badly inside the
        // dense rows this app is built from.
        "focus-visible:border-line-strong",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
