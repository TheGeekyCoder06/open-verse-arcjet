"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // ✅ don't show header on auth pages
  if (pathname === "/login" || pathname === "/register") return null;

  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();
        if (!mounted) return;

        if (data?.user?._id) setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ only render if user exists
  if (!user?._id) return null;

  return <Header user={user} />;
}
