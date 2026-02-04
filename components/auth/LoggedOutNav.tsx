"use client";

import Link from "next/link";

export default function LoggedOutNav() {
  return (
    <Link href="/login" className="btn btn-primary" data-umami-event="login_click">
      Login
    </Link>
  );
}

