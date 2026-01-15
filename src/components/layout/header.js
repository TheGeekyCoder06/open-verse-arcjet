"use client";

import { Edit, User, LogOut } from "lucide-react";
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
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        if (data?.user) setUser(data.user);
        else setUser(null);
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
    return username ? username.toLowerCase() : "me";
  }, [username]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-3 items-center h-16">
          {/* LEFT SPACER */}
          <div />

          {/* CENTER LOGO */}
          <div className="flex justify-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              OpenVerse
            </Link>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center justify-end gap-4">
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
                  onClick={() => router.push(`/profile/${usernameSlug}`)}
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
