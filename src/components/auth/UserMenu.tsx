"use client"

import { useEffect, useRef, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

export function UserMenu() {
  const { data: session, status } = useSession()

  // Loading state — skeleton to prevent layout shift
  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
    )
  }

  // Logged out
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
      >
        Sign in
      </button>
    )
  }

  // Logged in — avatar + dropdown
  return <UserAvatar session={session} />
}

function UserAvatar({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const name = session.user?.name || "User"
  const email = session.user?.email || ""
  const initials = name.substring(0, 2).toUpperCase()
  const image = session.user?.image
  const tier = session.user?.tier || "FREE"

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-xs font-medium cursor-pointer overflow-hidden border border-gray-700 hover:border-gray-500 transition-colors focus:outline-none shrink-0"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-lg shadow-black/40 p-1 min-w-[180px] z-50">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium truncate">{name}</span>
              {tier === "FREE" ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] font-semibold leading-none uppercase tracking-wider">FREE</span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 text-[10px] font-semibold leading-none uppercase tracking-wider">PRO</span>
              )}
            </div>
            {email && <div className="text-xs text-gray-500 truncate mt-0.5">{email}</div>}
          </div>
          <div className="border-t border-gray-800 my-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
