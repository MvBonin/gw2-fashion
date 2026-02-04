import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Template | GW2 Fashion",
  description: "Create and share a new Guild Wars 2 fashion template.",
  robots: { index: false },
};

export default function NewTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
