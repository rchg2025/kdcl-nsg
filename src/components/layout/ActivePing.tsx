"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export default function ActivePing() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    const sendPing = () => {
      fetch("/api/ping", { method: "POST" }).catch(() => {})
    }

    sendPing() // Initial ping
    const interval = setInterval(sendPing, 60000) // Every 1 minute

    return () => clearInterval(interval)
  }, [session])

  return null
}
