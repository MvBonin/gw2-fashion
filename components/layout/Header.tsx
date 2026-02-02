import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

export default function Header() {
  return (
    <header className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          GW2 Fashion
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link href="/" className="btn btn-ghost">
          Browse
        </Link>
        <Link href="/collections" className="btn btn-ghost">
          Collections
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
