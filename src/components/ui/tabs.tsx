"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // iOS segmented control: a recessed track holding the segments, with a
        // raised pill marking the selection.
        "inline-flex h-7 w-fit items-center justify-center gap-0.5 rounded-[9px] bg-white/[0.06] p-[2px] text-zinc-400",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // The selected segment is the only raised surface; unselected segments
        // are flat text, which is what keeps a segmented control from reading
        // as a row of buttons.
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-[12.5px] font-medium text-zinc-400 outline-none",
        "transition-[background-color,color,box-shadow] duration-[--duration-fast] ease-[--ease-ios]",
        "hover:text-zinc-200",
        "data-[state=active]:bg-surface-hover data-[state=active]:text-white data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.08)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
