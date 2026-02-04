import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | GW2 Fashion",
  description: "Sign in to GW2 Fashion with Discord to save and share fashion templates.",
  robots: { index: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
