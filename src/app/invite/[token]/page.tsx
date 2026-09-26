"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAcceptWorkspaceInvite } from "@/modules/invites/hooks/invites";

type Status =
  | { kind: "working" }
  | { kind: "joined"; workspaceName: string; alreadyMember: boolean }
  | { kind: "failed"; title: string; detail: string };

export default function InvitePage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const router = useRouter();
  const { mutateAsync } = useAcceptWorkspaceInvite();

  // A missing token is knowable at first render, so it is the initial state
  // rather than a setState fired synchronously from the effect below.
  const [status, setStatus] = useState<Status>(() =>
    token
      ? { kind: "working" }
      : {
          kind: "failed",
          title: "Invalid invite link",
          detail: "This link is missing its invite code.",
        }
  );

  /**
   * Accepting must happen exactly once per page load.
   *
   * This runs from an effect, and an effect can fire twice - React's dev
   * double-invoke, a fast refresh, or a remount after the router normalizes the
   * URL. The old code had no guard, and since accepting used to consume the
   * invite, the second run reported "invalid or expired" over a join that had
   * already succeeded.
   */
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;

    (async () => {
      try {
        const result = await mutateAsync(token);

        if (result.ok) {
          setStatus({
            kind: "joined",
            workspaceName: result.workspaceName,
            alreadyMember: result.alreadyMember,
          });
          toast.success(
            result.alreadyMember
              ? `You are already in "${result.workspaceName}"`
              : `Joined "${result.workspaceName}"`
          );
          setTimeout(() => {
            router.push("/workspace");
            router.refresh();
          }, 1200);
          return;
        }

        if (result.reason === "UNAUTHENTICATED") {
          // The ordinary first-time path: an invited teammate opens the link
          // before they have an account. Send them to sign in and come back.
          toast.info("Sign in to join this workspace");
          router.push(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
          return;
        }

        setStatus(
          result.reason === "EXPIRED"
            ? {
                kind: "failed",
                title: "This invite has expired",
                detail: "Invite links last 7 days. Ask for a new one.",
              }
            : {
                kind: "failed",
                title: "This invite is not valid",
                detail:
                  "The link may have been revoked, or copied incompletely.",
              }
        );
      } catch (error) {
        // Only genuine faults reach here now; expected outcomes are returned.
        setStatus({
          kind: "failed",
          title: "Something went wrong",
          detail:
            error instanceof Error
              ? error.message
              : "Please try the link again.",
        });
      }
    })();
  }, [token, mutateAsync, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-canvas px-6">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        {status.kind === "working" && (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
            <p className="text-[13px] text-zinc-400">Joining workspace…</p>
          </>
        )}

        {status.kind === "joined" && (
          <>
            <p className="text-[15px] font-medium text-zinc-100">
              {status.alreadyMember ? "You're already a member" : "You're in"}
            </p>
            <p className="text-[13px] text-zinc-400">
              {status.workspaceName}
            </p>
            <p className="mt-3 text-[11px] text-zinc-600">Taking you there…</p>
          </>
        )}

        {status.kind === "failed" && (
          <>
            <p className="text-[15px] font-medium text-red-400">
              {status.title}
            </p>
            <p className="text-[13px] leading-relaxed text-zinc-400">
              {status.detail}
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-[12.5px] text-zinc-300 transition-colors hover:bg-surface-hover"
            >
              Back to Impulse
            </button>
          </>
        )}
      </div>
    </div>
  );
}
