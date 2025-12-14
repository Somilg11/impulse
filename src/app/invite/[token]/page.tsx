"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useAcceptWorkspaceInvite } from "@/modules/invites/hooks/invites"; // Ensure this path is correct
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used based on grep results earlier

export default function InvitePage() {
    const params = useParams();
    const token = params?.token as string;
    const router = useRouter();
    const { mutate: acceptInvite, isPending, isError, error } = useAcceptWorkspaceInvite();

    useEffect(() => {
        if (token) {
            acceptInvite(token, {
                onSuccess: () => {
                    toast.success("Joined workspace successfully!");
                    router.push("/"); // Redirect to home/dashboard
                },
                onError: (err) => {
                    console.error(err)
                    toast.error("Failed to join workspace. The invite may be invalid or expired.");
                    // Optionally redirect to login or home after a delay
                    setTimeout(() => router.push("/"), 3000);
                },
            });
        } else {
            toast.error("Invalid invite link.");
            router.push("/");
        }
    }, [token, acceptInvite, router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <div className="flex flex-col items-center gap-2">
                {isPending ? (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Joining workspace...</p>
                    </>
                ) : isError ? (
                    <div className="text-center">
                        <p className="text-destructive font-medium">Invitation Failed</p>
                        <p className="text-sm text-muted-foreground">{error?.message || "Invalid or expired invite."}</p>
                        <p className="text-xs text-muted-foreground mt-4">Redirecting...</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Verifying invitation...</p>
                )}
            </div>
        </div>
    );
}