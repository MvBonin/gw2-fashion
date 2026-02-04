import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Collections | GW2 Fashion",
  description: "Your fashion template collections on GW2 Fashion.",
  robots: { index: false },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
