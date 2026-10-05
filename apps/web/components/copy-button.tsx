"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui";

export function CopyButton({
  value,
  label,
  children,
  variant = "ghost",
  size = "sm",
  className,
  icon: IdleIcon = Copy,
}: {
  value: string;
  /** Accessible name, e.g. "Copy room ID". */
  label: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "icon";
  className?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const Icon = copied ? Check : IdleIcon;
  return (
    <Button variant={variant} size={size} onClick={copy} aria-label={children ? undefined : label} title={label} className={className}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children && <span>{copied ? "Copied" : children}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}
