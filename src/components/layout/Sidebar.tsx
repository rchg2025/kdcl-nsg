"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getTotalUnreadCount } from "@/actions/chat"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileCheck, 
  ShieldCheck, 
  LogOut, 
  FileText,
  BarChart,
  CheckSquare,
  List,
  MessageSquare,
  Clock
} from "lucide-react"
import { signOut } from "next-auth/react"

export type MenuItem = {
  title: string
  href: string
  icon: any
}


export const adminMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Tiêu chuẩn & Tiêu chí", href: "/admin/criteria", icon: FileText },
  { title: "Nộp Minh chứng", href: "/collaborator/evidence", icon: FileText },
  { title: "Duyệt Minh chứng", href: "/supervisor/review", icon: FileCheck },
  { title: "Đánh giá KQ", href: "/investigator/evaluate", icon: CheckSquare },
  { title: "Quản lý thành viên", href: "/admin/users", icon: Users },
  { title: "Quản lý Danh mục", href: "/admin/categories", icon: List },
  { title: "Nhật ký Hệ thống", href: "/admin/logs", icon: Clock },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
  { title: "Cài đặt hệ thống", href: "/admin/settings", icon: Settings },
]

export const supervisorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/supervisor", icon: LayoutDashboard },
  { title: "Tiêu chuẩn & Tiêu chí", href: "/supervisor/criteria", icon: FileText },
  { title: "Nộp minh chứng", href: "/supervisor/evidence", icon: FileText },
  { title: "Duyệt minh chứng", href: "/supervisor/review", icon: FileCheck },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

export const collaboratorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/collaborator", icon: LayoutDashboard },
  { title: "Cập nhật minh chứng", href: "/collaborator/evidence", icon: FileText },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

export const investigatorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/investigator", icon: LayoutDashboard },
  { title: "Xem minh chứng", href: "/investigator/evidence", icon: FileText },
  { title: "Đánh giá chung", href: "/investigator/evaluate", icon: CheckSquare },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

export default function Sidebar({ menuItems, role }: { menuItems: MenuItem[], role: string }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await getTotalUnreadCount()
        setUnreadCount(count)
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-300">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white shadow-lg">
          <ShieldCheck size={20} />
        </div>
        <div>
          <span className="text-white font-bold text-sm block">KDCL - NSG</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{role}</span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/${role.toLowerCase()}`)
          const Icon = item.icon
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[var(--primary)] text-white shadow-md shadow-indigo-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              {item.href === "/messages" && unreadCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link 
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white w-full"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Hồ sơ cá nhân</span>
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-rose-500 hover:bg-rose-500 hover:text-white w-full"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
