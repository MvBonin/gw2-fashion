"use client";

import Link from "next/link";

export default function LoggedOutNav() {
  return (
    <Link href="/login" className="btn btn-primary">
      Login
    </Link>
  );
}

