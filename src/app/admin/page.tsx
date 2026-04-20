import { 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Database
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const [
    userCount, 
    standardCount, 
    criteriaCount, 
    approvedEvidences, 
    rejectedEvidences, 
    pendingEvidences
  ] = await Promise.all([
    prisma.user.count(),
    prisma.standard.count(),
    prisma.criterion.count(),
    prisma.evidence.count({ where: { status: "APPROVED" } }),
    prisma.evidence.count({ where: { status: "REJECTED" } }),
    prisma.evidence.count({ where: { status: { in: ["PENDING", "REVIEWING"] } } })
  ])

  const stats = [
    { title: "Tổng số thành viên", value: userCount.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Tổng tiêu chuẩn", value: standardCount.toString(), icon: Database, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
    { title: "Tổng tiêu chí con", value: criteriaCount.toString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ]

  const evStats = [
    { title: "Minh chứng Đạt", value: approvedEvidences.toString(), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Chưa Đạt / Bị từ chối", value: rejectedEvidences.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
    { title: "Đang chờ duyệt", value: pendingEvidences.toString(), icon: FileText, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  ]

  const recentUsers = await prisma.user.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tổng quan hệ thống</h1>
          <p className="text-slate-500 mt-1">Dữ liệu Kiểm định chất lượng thời gian thực ({new Date().getFullYear()})</p>
        </div>
      </div>
      
      <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-4">Hồ sơ Cấu trúc</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1 text-[var(--foreground)]">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-8">Tình trạng Minh chứng</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {evStats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1 text-[var(--foreground)]">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-lg mb-4">Biểu đồ (Minh họa)</h3>
          <div className="w-full h-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-end justify-around border border-dashed border-slate-300 dark:border-slate-700 p-4 pt-12">
            <div className="w-16 bg-blue-400 rounded-t-md relative h-[40%]" title="Q1"><span className="absolute -top-6 text-xs text-center w-full">40%</span></div>
            <div className="w-16 bg-blue-500 rounded-t-md relative h-[65%]" title="Q2"><span className="absolute -top-6 text-xs text-center w-full">65%</span></div>
            <div className="w-16 bg-blue-600 rounded-t-md relative h-[90%]" title="Q3"><span className="absolute -top-6 text-xs text-center w-full">90%</span></div>
            <div className="w-16 bg-[var(--primary)] rounded-t-md relative h-[100%]" title="Q4"><span className="absolute -top-6 text-xs text-center w-full text-[var(--primary)] font-bold">100%</span></div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-lg mb-4">Tài khoản mới</h3>
          <div className="space-y-4">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold">
                  {user.name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</h4>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
