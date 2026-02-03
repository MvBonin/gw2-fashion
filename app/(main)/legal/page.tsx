import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal & Attribution",
  description:
    "Legal notice, ArenaNet Content Use Policy, and attribution for GW2 Fashion.",
};

const CONTENT_USE_POLICY_URL = "https://www.arena.net/en/legal/content-terms-of-use";
const USER_AGREEMENT_URL = "https://arena.net/en/legal/user-agreement";
const GW2_API_WIKI_URL = "https://wiki.guildwars2.com/wiki/API:Main";
const GITHUB_REPO_URL = "https://github.com/MvBonin/gw2-fashion";

export default function LegalPage() {
  return (
    <div className="prose prose-neutral max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Legal & Attribution</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Unofficial Fansite</h2>
        <p>
          GW2 Fashion is an <strong>unofficial fansite</strong>. This site is
          not affiliated with, endorsed by, or sponsored by ArenaNet, LLC or
          NCSOFT Corporation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Contribute</h2>
        <p>
          GW2 Fashion is open source. If you&apos;d like to contribute code,
          report bugs, or suggest features, the project lives on GitHub:
        </p>
        <p>
          <Link
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            github.com/MvBonin/gw2-fashion
          </Link>
        </p>
        <p className="text-sm text-base-content/80 mt-2">
          If you&apos;d like to support the site, you can{" "}
          <Link
            href="https://ko-fi.com/mvbonin"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            buy me a coffee on Ko-fi
          </Link>{" "}
          or send in-game gold to <strong className="font-mono">mbonin.1085</strong>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">ArenaNet Content Use Policy</h2>
        <p>
          This site uses Guild Wars 2 content (including the GW2 API and game
          assets such as icons) in accordance with ArenaNet&apos;s Content Use
          Policy for Fan Projects.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <Link
              href={CONTENT_USE_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              ArenaNet Content Use Policy
            </Link>
          </li>
          <li>
            <Link
              href={USER_AGREEMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              NCW User Agreement
            </Link>{" "}
            (applies to API use)
          </li>
          <li>
            <Link
              href={GW2_API_WIKI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary"
            >
              Guild Wars 2 API (wiki)
            </Link>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Copyright & Trademarks</h2>
        <p className="text-sm whitespace-pre-line">
          {`Guild Wars Games © ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation.

All other trademarks are the property of their respective owners.`}
        </p>
      </section>

      <p className="text-sm text-base-content/70">
        We use the Content Use Policy as published at the link above. ArenaNet
        may update the policy from time to time; it is our responsibility to
        check for changes and comply with the current version.
      </p>
    </div>
  );
}
