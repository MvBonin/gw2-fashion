import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Page Not Found | GW2 Fashion",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-base-100">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        <Image
          src="/icon.png"
          alt="gw2-fashion.com Logo"
          width={120}
          height={120}
          className="h-24 w-24 md:h-28 md:w-28 flex-shrink-0 opacity-90"
          priority
        />
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-base-content">
            404
          </h1>
          <p className="text-lg text-base-content/80">
            Looks like this look got lost in the Mists. The page you&apos;re
            looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="btn btn-primary gap-2 normal-case text-base"
        >
          Back to GW2 Fashion
        </Link>
      </div>
    </div>
  );
}
