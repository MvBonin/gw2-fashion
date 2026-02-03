import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsTrigger from "@/components/layout/CookieSettingsTrigger";

export const metadata: Metadata = {
  title: "Legal & Attribution",
  description:
    "Legal notice, Privacy Policy, Terms of Service, ArenaNet Content Use Policy, and attribution for GW2 Fashion.",
};

const CONTENT_USE_POLICY_URL = "https://www.arena.net/en/legal/content-terms-of-use";
const USER_AGREEMENT_URL = "https://arena.net/en/legal/user-agreement";
const GW2_API_WIKI_URL = "https://wiki.guildwars2.com/wiki/API:Main";
const GITHUB_REPO_URL = "https://github.com/MvBonin/gw2-fashion";

export default function LegalPage() {
  return (
    <div className="prose prose-neutral max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Legal & Attribution</h1>

      <nav className="mb-8 text-sm text-base-content/80">
        <p className="font-medium text-base-content mb-1">On this page:</p>
        <ul className="list-disc pl-6 space-y-0.5">
          <li><Link href="#cookies" className="link link-hover">Cookies &amp; local storage</Link></li>
          <li><Link href="#privacy-policy" className="link link-hover">Privacy Policy</Link></li>
          <li><Link href="#terms-of-service" className="link link-hover">Terms of Service</Link></li>
          <li><Link href="#copyright" className="link link-hover">Copyright &amp; Trademarks</Link></li>
        </ul>
      </nav>

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

      <section id="cookies" className="mb-8 scroll-mt-4">
        <h2 className="text-xl font-semibold mb-2">
          Cookies &amp; local storage (privacy)
        </h2>
        <p>
          We set cookies and use local storage (localStorage) as follows:
        </p>
        <ul className="list-disc pl-6 space-y-1 my-2">
          <li>
            <strong>Strictly necessary (no consent required):</strong> Cookies
            for sign-in (session) and technical operation of the site.
          </li>
          <li>
            <strong>Optional (only with your consent):</strong> Local storage for
            convenience features like &ldquo;recently viewed&rdquo;,
            &ldquo;copied&rdquo; status, and profile cache. This data stays on your
            device and is not sent to us.
          </li>
          <li>
            <strong>Website analytics (no consent required):</strong> We use
            Umami for anonymised usage statistics (e.g. page views, referrer,
            device type). Analytics run regardless of your cookie choice and are
            described in the Privacy Policy below. No separate consent is required.
          </li>
        </ul>
        <p>
          You can withdraw or change your consent at any time using{" "}
          <CookieSettingsTrigger /> in the footer. You can reopen cookie
          settings there and choose &ldquo;Necessary only&rdquo;.
        </p>
      </section>

      <section id="privacy-policy" className="mb-8 scroll-mt-4">
        <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
        <p className="text-sm text-base-content/80 mb-4">
          This privacy policy applies in addition to German and European data
          protection law (GDPR/DSGVO, TTDSG). GW2 Fashion is a free,
          non-commercial community website. We do not sell your data or use it
          for advertising.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Controller and contact</h3>
        <p>
          The operator of this website is responsible for data processing. You can
          reach us via the links in the &ldquo;Contribute&rdquo; section above
          (e.g. GitHub, Ko-fi). For data protection requests (e.g. access,
          deletion), please use one of those channels or the contact option stated
          there. You also have the right to lodge a complaint with a supervisory
          authority (e.g. in Germany, the competent state data protection office).
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">What we process</h3>
        <p>
          <strong>Account and profile data:</strong> When you sign in (e.g. via
          Discord), we store and use: user ID, username, display name, avatar URL,
          and optionally email, GW2 account name (if you make it public), and bio.
          We also store timestamps (e.g. registration, last seen) and that you
          accepted our terms. This is used to run your account and show your
          profile and templates.
        </p>
        <p>
          <strong>Templates and engagement:</strong> Your created templates
          (fashion codes, images, titles, tags), favourites, and similar
          engagement are stored and displayed according to the site&apos;s
          functionality.
        </p>
        <p>
          <strong>Strictly necessary:</strong> Session and authentication cookies
          are used for sign-in and technical operation. No consent is required
          for these.
        </p>
        <p>
          <strong>Website analytics (Umami):</strong> We use Umami (self-hosted,
          privacy-friendly) for anonymised analytics (e.g. page views, referrer,
          device type). We do not collect personal data in the classical sense
          (no tracking cookies, no sharing with third parties for advertising).
          No consent is required; we rely on legitimate interests in improving
          the service. Technical data typically includes anonymised visit
          statistics; we do not store full IP addresses for analytics purposes.
        </p>
        <p>
          <strong>Optional (only with your consent):</strong> If you choose
          &ldquo;Accept all,&rdquo; we may use local storage for convenience
          (e.g. recently viewed templates, profile cache). Umami analytics are
          loaded regardless of this choice and are described in the paragraph
          above.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Purpose and legal basis</h3>
        <p>
          We process data to operate this free community site, provide accounts
          and templates, and improve usability. Legal bases: performance of our
          service (contract), your consent (optional local storage only), and
          where applicable legitimate interests (e.g. security, operation,
          anonymised analytics via Umami). We do not use your data for commercial
          advertising or selling.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Recipients and storage</h3>
        <p>
          Data is stored and processed with Supabase (hosting/database) in the EU.
          Umami analytics run on our own (self-hosted) or contracted infrastructure;
          we do not transfer analytics data to external advertising or analytics
          companies. We do not share your data with third parties for marketing.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Retention</h3>
        <p>
          Account and template data are kept until you delete your account or the
          content. Session cookies last for the session. Optional local storage
          can be cleared when you withdraw consent (cookie settings). Analytics
          data are retained only as long as needed for aggregated statistics. We
          may retain some data where required by law (e.g. for legal claims).
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Your rights</h3>
        <p>
          You have the right to access, rectify, erase, restrict processing, and
          object, as well as data portability where applicable. You can withdraw
          consent for optional processing at any time via{" "}
          <CookieSettingsTrigger /> in the footer. To exercise your rights or ask
          questions, contact us via the links above. You may also complain to a
          data protection supervisory authority (e.g. in your country or in
          Germany).
        </p>
      </section>

      <section id="terms-of-service" className="mb-8 scroll-mt-4">
        <h2 className="text-xl font-semibold mb-2">Terms of Service</h2>
        <p className="text-sm text-base-content/80 mb-4">
          By using GW2 Fashion or creating an account, you agree to these terms.
          This is a free, non-commercial community website.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Service</h3>
        <p>
          GW2 Fashion provides a platform to share and discover Guild Wars 2
          fashion templates. The service is offered free of charge and without
          commercial purpose. We do not guarantee uninterrupted availability or
          any particular features.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Analytics and data</h3>
        <p>
          Use of this website constitutes your agreement to our use of Umami
          analytics as described in our{" "}
          <Link href="#privacy-policy" className="link link-hover">
            Privacy Policy
          </Link>
          . Analytics are anonymised and do not involve personal data in the
          classical sense; no separate consent is required. By using the site you
          accept this practice.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Account and acceptable use</h3>
        <p>
          You must comply with Discord&apos;s and ArenaNet&apos;s applicable terms
          when using this site. You may not use the site for illegal purposes,
          harassment, spam, or to overload or abuse the systems. You must not
          impersonate others or violate third-party rights.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">User content</h3>
        <p>
          By uploading templates, images, or other content, you grant us the
          rights needed to store, display, and operate the service (e.g. showing
          templates, generating thumbnails). You confirm that you have the rights
          to that content and that it does not infringe others&apos; rights or
          ArenaNet&apos;s policies. We may remove content that violates these terms
          or the law.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Disclaimer and liability</h3>
        <p>
          The site is provided &ldquo;as is.&rdquo; We do not warrant that it is
          error-free or complete. To the extent permitted by law (including German
          law), we exclude liability for slight negligence in connection with this
          free service. Liability for intent or gross negligence is not excluded.
          We are not responsible for the content of external links.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Termination and changes</h3>
        <p>
          We may suspend or terminate accounts that breach these terms. You can
          stop using the site or delete your account at any time. We may update
          these terms; we will indicate changes appropriately (e.g. on this page).
          Continued use after changes constitutes acceptance.
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">Governing law and contact</h3>
        <p>
          German law applies. For questions about these terms or the Privacy
          Policy, please contact us via the links in the Contribute section
          above.
        </p>
      </section>

      <section id="copyright" className="mb-8 scroll-mt-4">
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
