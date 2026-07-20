"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, UserRound, ShieldCheck, PenLine } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/authors";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/seminars/", label: "Seminars" },
  { href: "/blog/", label: "Blog" },
  { href: "/research/", label: "Research" },
  { href: "/members/", label: "Members" },
  { href: "/noticeboard/", label: "Noticeboard" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4.5 dark:hidden" />
      <Moon className="size-4.5 hidden dark:block" />
    </Button>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { session, profile, isAdmin, signOut } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 text-primary">
          <Logo />
          <div className="leading-tight">
            <div className="font-serif text-[1.05rem] font-bold tracking-tight text-foreground">
              Health Equity Australasia
            </div>
            <div className="text-[0.68rem] font-medium uppercase tracking-widest text-muted-foreground">
              Health Equity SIG
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {session && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-ring focus-visible:ring-2" aria-label="Account menu">
                  <Avatar className="size-9 border">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span>{profile.display_name || "My account"}</span>
                  <Badge
                    variant={profile.role === "pending" ? "secondary" : "default"}
                    className="w-fit capitalize"
                  >
                    {profile.role}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/"><UserRound /> My profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/blog/write/"><PenLine /> Write a post</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/"><ShieldCheck /> Admin panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login/">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register/">Join us</Link>
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            {!session && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login/" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/register/" onClick={() => setOpen(false)}>Join us</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
