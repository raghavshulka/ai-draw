import Link from "next/link";
import { SiteHeader } from "./site-header";
import { Card } from "./ui";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: { prompt: string; href: string; linkText: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center sm:py-16">
        <Card className="w-full max-w-sm p-6 sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer.prompt}{" "}
            <Link
              href={footer.href}
              className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {footer.linkText}
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
