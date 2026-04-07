"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function BillingSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown((currentCountdown) => {
        if (currentCountdown <= 1) {
          window.clearInterval(interval)
          router.replace("/")
          return 0
        }

        return currentCountdown - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-800/50 bg-green-900/30 text-xl text-green-400">
          ✓
        </div>
        <div>
          <h1 className="font-mono text-lg font-medium text-white">
            You&apos;re upgraded
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your plan is now active.
          </p>
        </div>
        <p className="text-xs text-gray-600">
          Redirecting in {countdown}s...
        </p>
        <button
          onClick={() => router.replace("/")}
          className="text-sm text-blue-400 underline transition-colors hover:text-blue-300"
        >
          Go now
        </button>
      </div>
    </div>
  )
}
