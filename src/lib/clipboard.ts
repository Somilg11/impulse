import { toast } from "sonner";

/**
 * Copy text, and say so.
 *
 * Every copy in the app goes through here for two reasons. A copy leaves no
 * trace on screen, so it is one of the few actions that genuinely needs a
 * toast - without one there is no way to tell it worked. And the Clipboard API
 * fails in ways worth handling rather than ignoring: it rejects when the
 * document is not focused, and is absent entirely outside a secure context.
 */
export async function copyToClipboard(
  text: string,
  label = "Copied"
): Promise<boolean> {
  if (!text) {
    toast.error("Nothing to copy");
    return false;
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Older Safari and any non-secure context land here.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("Copy command was rejected");
    }

    // Showing a truncated value confirms *what* was copied, not just that
    // something was.
    toast.success(label, {
      description: text.length > 60 ? `${text.slice(0, 57)}…` : text,
    });
    return true;
  } catch (error) {
    toast.error("Could not copy", {
      description:
        error instanceof Error ? error.message : "The clipboard is unavailable",
    });
    return false;
  }
}
