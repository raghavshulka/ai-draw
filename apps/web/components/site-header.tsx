"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { buttonClasses, focusRing } from "./ui";
import { useAuth } from "../app/providers/authProvider";
import { cn } from "../cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 rounded-md font-semibold tracking-tight", focusRing, className)}>
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <rect width="24" height="24" rx="6" className="fill-foreground" />
        <path
          d="M6 15.5c2-4.5 4-6.5 5.5-6.5 2 0 .5 6 2.5 6 1.2 0 2.3-1.6 4-4.5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-background"
        />
      </svg>
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>AIDraw</span>
    </Link>
  );
}

const navLinkBase = cn(
  "rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
  focusRing
);

export function SiteHeader({
  children,
  fluid = false,
}: {
  /** Page-specific content shown between the logo and the nav (e.g. room info). */
  children?: React.ReactNode;
  /** Full-width bar (used by the room page) instead of the centered container. */
  fluid?: boolean;
}) {
  const { isAuthenticated, ready, logout } = useAuth();
  // In the full-width room bar, text links give way to the room controls on phones.
  const navLink = cn(navLinkBase, fluid && "hidden sm:inline-flex");
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div
        className={cn(
          "flex h-14 items-center gap-3",
          fluid ? "px-3 sm:px-4" : "mx-auto w-full max-w-6xl px-4 sm:px-6"
        )}
      >
        <Logo className="shrink-0" compact={fluid} />
        <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 sm:gap-2">
          {ready &&
            (isAuthenticated ? (
              <>
                <Link href="/dashboard" className={navLink}>
                  Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className={navLink}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className={navLink}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={buttonClasses({ size: "sm" })}>
                  Get started
                </Link>
              </>
            ))}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
