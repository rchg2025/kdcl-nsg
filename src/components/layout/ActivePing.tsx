"use client"

import { useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

export default function ActivePing() {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  const prevNotifs = useRef(0)
  const prevMsgs = useRef(0)
  const firstLoad = useRef(true)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!session) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Start 5-minute auto-logout timer
        logoutTimerRef.current = setTimeout(() => {
          signOut({ callbackUrl: '/login' })
        }, 5 * 60 * 1000)
      } else {
        // Clear timer if user returns before 5 mins
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current)
          logoutTimerRef.current = null
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    }
  }, [session])

  useEffect(() => {
    if (!session) return

    const sendPing = async () => {
      try {
        const res = await fetch("/api/ping", { method: "POST" })
        if (!res.ok) return
        const data = await res.json()
        
        if (data.success) {
          const isNotOnMessagePage = !pathname?.startsWith("/messages")
          
          if (!firstLoad.current) {
            let shouldPlaySound = false
            
            // Nuew notification?
            if (data.unreadNotifs > prevNotifs.current) {
              shouldPlaySound = true
            }
            
            // New message and not on chat page?
            if (data.unreadMsgs > prevMsgs.current && isNotOnMessagePage) {
              shouldPlaySound = true
            }
            
            if (shouldPlaySound) {
              const audio = new Audio("/sounds/tingtingtinnhan.mp3")
              audio.play().catch(e => console.log("Audio play blocked:", e))
            }
          }
          
          prevNotifs.current = data.unreadNotifs
          prevMsgs.current = data.unreadMsgs
          firstLoad.current = false
        }
      } catch (e) {}
    }

    sendPing() // Initial ping
    const interval = setInterval(sendPing, 15000) // Every 15 seconds for responsiveness

    return () => clearInterval(interval)
  }, [session, pathname])

  return null
}
