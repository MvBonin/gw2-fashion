import Link from "next/link";
import { Coffee, Github, GithubIcon } from "lucide-react";
import CookieSettingsTrigger from "@/components/layout/CookieSettingsTrigger";

const GITHUB_REPO_URL = "https://github.com/MvBonin/gw2-fashion";
const KOFI_URL = "https://ko-fi.com/mvbonin";
const GW2_GOLD_ICON_URL =
  "https://wiki.guildwars2.com/images/d/d1/Gold_coin.png";

export default function Footer() {
  return (
    <footer className="footer footer-center p-5 bg-base-200 text-base-content">
      <aside className="max-w-3xl mx-auto space-y-1">
        {/* 1. Identity */}
        <p className="font-bold">
          GW2 Fashion - Community Fashion Templates
        </p>
        <p className="text-sm text-base-content/80">
          © 2026 - Made with ❤️ for the lovely GW2 Community
        </p>

        {/* 3. Support */}
        <p className="text-sm text-base-content/80 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          
          <Link
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover"
          >Support me with a <Coffee className="w-3.5 h-3.5 inline" />
          </Link> {" · "}
          <span>help me get some nice fashion too ( </span>
          <span className="inline-flex items-center gap-0.5 font-mono">
          <img
              src={GW2_GOLD_ICON_URL}
              alt=""
              width={16}
              height={16}
              className="inline-block align-middle"
            /> {" "}mbonin.1085
          </span>) {" · "} contribute <Link href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="link link-hover"><GithubIcon className="w-3.5 h-3.5 inline mx-0.5" />GitHub</Link>
        </p>

        {/* 4. Legal */}
        <p className="text-xs max-w-lg mx-auto pt-1">
          Guild Wars Games © ArenaNet LLC. All rights reserved. NCSOFT,
          ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of
          Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and
          Guild Wars 2: Secrets of the Obscure and all associated logos,
          designs, and composite marks are trademarks or registered trademarks
          of NCSOFT Corporation. All other trademarks are the property of their
          respective owners.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0">
          <Link href="/legal" className="link link-hover text-sm">
            Legal & Attribution
          </Link>
          <span> · </span>
          <CookieSettingsTrigger />
        </p>
      </aside>
    </footer>
  );
}
