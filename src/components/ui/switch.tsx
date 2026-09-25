"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // iOS toggle: 51x31 at system scale, here at 44x26 to sit correctly in
        // a dense UI. Green-free - the accent is the app's blue.
        "peer inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-colors duration-[--duration-base] ease-[--ease-ios] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:bg-brand data-[state=unchecked]:bg-white/[0.14]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] ring-0 transition-transform duration-[--duration-base] ease-[--ease-ios] data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
