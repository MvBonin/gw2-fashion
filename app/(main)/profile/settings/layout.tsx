import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | GW2 Fashion",
  description: "Manage your GW2 Fashion profile and account settings.",
  robots: { index: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
