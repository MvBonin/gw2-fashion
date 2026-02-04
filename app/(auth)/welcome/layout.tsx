import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome | GW2 Fashion",
  description: "Complete your GW2 Fashion profile: choose a username and optional GW2 API key.",
  robots: { index: false },
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
