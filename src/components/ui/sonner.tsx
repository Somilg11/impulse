"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toasts, styled as iOS notification cards.
 *
 * The theme is pinned to dark rather than read from next-themes: the app shell
 * is dark at every breakpoint, and a system-light toast over it was the one
 * surface that broke the palette.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      // Long enough to read a truncated URL, short enough not to sit in the way.
      duration={3200}
      offset={16}
      className="toaster group"
      // Sonner sets `background: var(--normal-bg)` in its own stylesheet, which
      // out-specifies a utility class on the toast - the surface has to be set
      // through the variables it actually reads.
      style={
        {
          "--normal-bg": "color-mix(in srgb, var(--color-surface-raised) 95%, transparent)",
          "--normal-text": "var(--color-zinc-100)",
          "--normal-border": "var(--color-line)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      icons={{
        success: <CircleCheckIcon className="size-4 text-brand" />,
        info: <InfoIcon className="size-4 text-zinc-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-zinc-400" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group/toast flex items-start gap-2.5 rounded-[12px] border border-line bg-surface-raised/95 px-3.5 py-3 text-[13px] text-zinc-100 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          title: "text-[13px] font-medium leading-snug text-zinc-100",
          description:
            "mt-0.5 break-all text-[11.5px] leading-snug text-zinc-500",
          actionButton:
            "rounded-[7px] bg-brand px-2 py-1 text-[11.5px] font-medium text-white",
          cancelButton:
            "rounded-[7px] bg-white/[0.08] px-2 py-1 text-[11.5px] text-zinc-300",
          closeButton: "border-line bg-surface-raised text-zinc-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
