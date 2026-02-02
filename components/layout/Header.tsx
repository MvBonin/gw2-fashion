import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LoggedInNav from "@/components/auth/LoggedInNav";
import LoggedOutNav from "@/components/auth/LoggedOutNav";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="navbar bg-base-100 shadow-lg">
      <div className="flex-none">
        <Link href="/" className="btn btn-ghost text-xl flex items-center gap-2 normal-case">
          <Image
            src="/icon.png"
            alt="gw2-fashion.com Logo"
            width={265}
            height={265}
            className="h-16 w-16 flex-shrink-0"
            priority
          />
          <span>GW2 Fashion</span>
        </Link>
      </div>
      <div className="flex-1"></div>
      <div className="flex-none flex items-center gap-2">
        <Link href="/template/new" className="btn btn-primary btn-ghost">
          Add Fashion
        </Link>
        <Link href="/" className="btn btn-ghost">
          Fashion
        </Link>
        <Link href="/collections" className="btn btn-ghost">
          Collections
        </Link>
        {user && profile ? (
          <LoggedInNav profile={profile} />
        ) : (
          <LoggedOutNav />
        )}
      </div>
    </header>
  );
}
