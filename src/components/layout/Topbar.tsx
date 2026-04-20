"use client"

import { Bell, Menu, Search, UserCircle } from "lucide-react"

export default function Topbar({ user }: { user: any }) {
  return (
    <header className="h-16 bg-white dark:bg-[#09090b] border-b border-[var(--border)] flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-500 hover:text-slate-700">
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-[var(--primary)] transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#09090b]"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold leading-none">{user?.name || "Người dùng"}</p>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          </div>
          <UserCircle size={32} className="text-slate-400" />
        </div>
      </div>
    </header>
  )
}
