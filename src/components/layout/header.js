"use client";

import { Edit, Search, User, LogOut } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { logoutUser } from "@/actions/logout";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Header({ user: initialUser = null }) {
  const router = useRouter();

  // Prefer server-provided user first (fast, no flicker)
  const [user, setUser] = useState(initialUser);

  // Optional: refresh user on client in case token changed after hydration
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/me",{
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (!mounted) return;

        if (data?.user) setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    const result = await logoutUser();
    if (result?.success) router.push("/login");
  }

  const username = useMemo(() => {
    return user?.username || user?.email?.split("@")?.[0] || null;
  }, [user]);

  const usernameSlug = useMemo(() => {
    return username ? username.toLowerCase() : null;
  }, [username]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold tracking-tight cursor-pointer">
            <Link href="/">OpenVerse</Link>
          </h1>

          <div className="flex items-center gap-4">

            <Button
              onClick={() => router.push("/blog/create")}
              variant="ghost"
              size="icon"
              aria-label="Create blog"
            >
              <Edit className="h-6 w-6" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>
                    {(username?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={!user?._id}
                  onClick={() => {
                    if (!user?._id) return;
                    router.push(`/profile/${user._id}`);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
