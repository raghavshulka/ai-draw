"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { buttonClasses } from "./ui"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const label = isDark ? "Switch to light theme" : "Switch to dark theme"

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={buttonClasses({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-foreground" })}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  )
}
