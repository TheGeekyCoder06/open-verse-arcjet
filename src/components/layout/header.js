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
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Load logged-in user
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();

        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    const result = await logoutUser();
    if (result?.success) router.push("/login");
  }

  const username =
    user?.username ||
    user?.email?.split("@")[0] ||
    null;

  const usernameSlug = username
    ? username.toLowerCase()
    : "me";

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          <h1 className="text-2xl font-bold tracking-tight cursor-pointer">
            <Link href="/">OpenVerse</Link>
          </h1>

          <div className="flex items-center gap-4">

            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search blogs…"
                className="pl-10 rounded-full bg-muted/40 focus-visible:ring-1"
                readOnly
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <Button
              onClick={() => router.push("/blog/create")}
              variant="ghost"
              size="icon"
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
