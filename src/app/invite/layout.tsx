import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace invite",
  description: "Accept an invitation to join an Impulse workspace.",
  // Invite tokens must never end up in a search index.
  robots: { index: false, follow: false },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
