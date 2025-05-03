"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        className="rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
      >
        <span className="sr-only">Toggle theme</span>
        <Moon className="h-5 w-5 text-foreground" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 