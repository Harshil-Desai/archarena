"use client"

import { Monitor } from "lucide-react"

// D-09: Show a notice on mobile viewports instead of attempting touch canvas support.
// Hidden at md breakpoint and above via Tailwind md:hidden.
export function MobileNotice() {
  return (
    <div className="md:hidden bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mx-4 mt-4 flex items-center gap-3">
      <Monitor className="h-5 w-5 text-amber-300 shrink-0" />
      <p className="text-sm text-amber-200">
        This experience works best on desktop. Switch to a larger screen for the full canvas.
      </p>
    </div>
  )
}
