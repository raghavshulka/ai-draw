"use client";

import Link from "next/link";
import { ModeToggle } from "../components/mode-toggle";
import { useAuth } from "./providers/authProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="font-bold">
            AI Draw
          </Link>
          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium hover:text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium hover:text-primary">
                  Sign In
                </Link>
                <Link href="/sign-up" className="text-sm font-medium hover:text-primary">
                  Sign Up
                </Link>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Welcome to AI Draw
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Create beautiful artwork with the power of AI
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                {!isAuthenticated ? (
                  <Link
                    href="/sign-up"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Get Started
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
