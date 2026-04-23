"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getTotalUnreadCount } from "@/actions/chat"
import { getNotifications, getUnreadNotificationCount, markNotificationsRead } from "@/actions/notification"
import { getPendingEvidenceCount, getRejectedEvaluationsCount } from "@/actions/supervisor"
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
  Clock,
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"
import { signOut } from "next-auth/react"

export type MenuItem = {
  title: string
  href: string
  icon: any
}


export const adminMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Thống kê", href: "/admin/statistics", icon: BarChart },
  { title: "Tiêu chí & Tiêu chuẩn", href: "/admin/criteria", icon: FileText },
  { title: "Nộp Minh chứng", href: "/collaborator/evidence", icon: FileText },
  { title: "Duyệt Minh chứng", href: "/supervisor/review", icon: FileCheck },
  { title: "Xem minh chứng", href: "/investigator/evidence", icon: Search },
  { title: "Đánh giá KQ", href: "/investigator/evaluate", icon: CheckSquare },
  { title: "Quản lý thành viên", href: "/admin/users", icon: Users },
  { title: "Quản lý Danh mục", href: "/admin/categories", icon: List },
  { title: "Nhật ký Hệ thống", href: "/admin/logs", icon: Clock },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
  { title: "Cài đặt hệ thống", href: "/admin/settings", icon: Settings },
]

export const supervisorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/supervisor", icon: LayoutDashboard },
  { title: "Thống kê", href: "/supervisor/statistics", icon: BarChart },
  { title: "Tiêu chí & Tiêu chuẩn", href: "/supervisor/criteria", icon: FileText },
  { title: "Quản lý Danh mục", href: "/supervisor/categories", icon: List },
  { title: "Nộp minh chứng", href: "/supervisor/evidence", icon: FileText },
  { title: "Duyệt minh chứng", href: "/supervisor/review", icon: FileCheck },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

export const collaboratorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/collaborator", icon: LayoutDashboard },
  { title: "Thống kê", href: "/collaborator/statistics", icon: BarChart },
  { title: "Nộp minh chứng", href: "/collaborator/evidence", icon: FileText },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

export const investigatorMenu: MenuItem[] = [
  { title: "Tổng quan", href: "/investigator", icon: LayoutDashboard },
  { title: "Xem minh chứng", href: "/investigator/evidence", icon: FileText },
  { title: "Đánh giá chung", href: "/investigator/evaluate", icon: CheckSquare },
  { title: "Trò chuyện", href: "/messages", icon: MessageSquare },
]

type NotifItem = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: Date
}

export default function Sidebar({ menuItems, role }: { menuItems: MenuItem[], role: string }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [pendingEvidenceCount, setPendingEvidenceCount] = useState(0)
  const [rejectedEvalCount, setRejectedEvalCount] = useState(0)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const [chatCount, nCount] = await Promise.all([
          getTotalUnreadCount(),
          getUnreadNotificationCount()
        ])
        setUnreadCount(chatCount)
        setNotifCount(nCount)

        if (role === "Quản trị viên" || role === "Giám sát viên" || role === "ADMIN" || role === "SUPERVISOR") {
          const pendingCount = await getPendingEvidenceCount()
          const rCount = await getRejectedEvaluationsCount()
          setPendingEvidenceCount(pendingCount)
          setRejectedEvalCount(rCount)
        }
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 8000)
    return () => clearInterval(interval)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const openNotifPanel = async () => {
    if (showNotifPanel) {
      setShowNotifPanel(false)
      return
    }
    try {
      const notifs = await getNotifications()
      setNotifications(notifs)
      setShowNotifPanel(true)
      // Mark all as read
      await markNotificationsRead()
      setNotifCount(0)
    } catch (e) {}
  }

  const notifTypeColors: Record<string, string> = {
    EVIDENCE_APPROVED: "text-emerald-500",
    EVIDENCE_REJECTED: "text-red-500",
    EVIDENCE_REVIEWING: "text-blue-500",
    EVIDENCE_PENDING: "text-amber-500"
  }

  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Vừa xong"
    if (mins < 60) return `${mins} phút trước`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} giờ trước`
    const days = Math.floor(hrs / 24)
    return `${days} ngày trước`
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col h-[100dvh] text-slate-300 transform transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      <div className={`flex items-center border-b border-slate-800 shrink-0 transition-all duration-300 ${isCollapsed ? 'flex-col py-4 gap-4 h-auto' : 'h-16 justify-between px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex shrink-0 items-center justify-center text-white shadow-lg">
            <ShieldCheck size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-white font-bold text-sm block whitespace-nowrap">KDCL - NSG</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest whitespace-nowrap">{role}</span>
            </div>
          )}
        </div>
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifPanel}
            className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Thông báo"
          >
            <Bell size={18} className={notifCount > 0 ? "text-amber-400" : "text-slate-400"} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in shadow-sm">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifPanel && (
            <div className="absolute left-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Thông báo</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-40" />
                    Chưa có thông báo nào
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link
                      href={n.link || "#"}
                      key={n.id}
                      onClick={() => setShowNotifPanel(false)}
                      className={`block px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}
                    >
                      <div className={`text-xs font-bold mb-0.5 ${notifTypeColors[n.type] || "text-slate-500"}`}>
                        {n.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
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
              title={isCollapsed ? item.title : undefined}
              className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[var(--primary)] text-white shadow-md shadow-indigo-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>}
              </div>
              {!isCollapsed && item.href === "/messages" && unreadCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
              {!isCollapsed && item.href === "/supervisor/review" && (
                <div className="flex gap-1 shrink-0">
                  {rejectedEvalCount > 0 && (
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in" title="Đánh giá Không Đạt">
                      {rejectedEvalCount > 99 ? '99+' : rejectedEvalCount}
                    </div>
                  )}
                  {pendingEvidenceCount > 0 && (
                    <div className="bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in" title="Chờ duyệt">
                      {pendingEvidenceCount > 99 ? '99+' : pendingEvidenceCount}
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && ((item.href === "/messages" && unreadCount > 0) || (item.href === "/supervisor/review" && (rejectedEvalCount > 0 || pendingEvidenceCount > 0))) && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-sm animate-in zoom-in" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 flex flex-col gap-2 shrink-0 items-center">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white ${isCollapsed ? 'justify-center px-0 w-12' : 'px-3 w-full'}`}
          title={isCollapsed ? "Mở rộng" : "Thu gọn sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} className="shrink-0" /> : <PanelLeftClose size={18} className="shrink-0" />}
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Thu gọn</span>}
        </button>
        <Link 
          href="/profile"
          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white ${isCollapsed ? 'justify-center px-0 w-12' : 'px-3 w-full'}`}
          title={isCollapsed ? "Hồ sơ cá nhân" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Hồ sơ cá nhân</span>}
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 text-rose-500 hover:bg-rose-500 hover:text-white ${isCollapsed ? 'justify-center px-0 w-12' : 'px-3 w-full'}`}
          title={isCollapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Đăng xuất</span>}
        </button>
      </div>
    </aside>
    </>
  )
}
