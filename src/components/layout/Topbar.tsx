"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, Search, UserCircle } from "lucide-react"

import Link from "next/link"
import { getUnreadNotificationCount } from "@/actions/notification"

export default function Topbar({ user }: { user: any }) {
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const nCount = await getUnreadNotificationCount()
        setNotifCount(nCount)
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-16 bg-white dark:bg-[#09090b] border-b border-[var(--border)] flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} className="md:hidden text-slate-500 hover:text-slate-700">
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="md:hidden font-black text-lg tracking-tight text-[var(--primary)] mr-2">
          KĐCL NSG
        </Link>
      </div>
      
      <div className="flex items-center gap-5">
        <button 
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
          className="md:hidden text-slate-500 hover:text-[var(--primary)] p-1 transition-colors relative"
        >
          <Bell size={22} />
          {notifCount > 0 && (
            <span className="absolute 0 right-0 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
        
        <Link href="/profile" className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold leading-none group-hover:text-[var(--primary)] transition-colors">{user?.name || "Người dùng"}</p>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          </div>
          <UserCircle size={32} className="text-slate-400 group-hover:text-[var(--primary)] transition-colors" />
        </Link>
      </div>
    </header>
  )
}
