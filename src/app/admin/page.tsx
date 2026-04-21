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
import StatCharts from "@/components/dashboard/StatCharts"
import { getDashboardStats } from "@/actions/dashboard"

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

  // Get synchronized detailed stats for Investigator evaluating accuracy
  const { summary: { invApprovedCount: invApproved, invRejectedCount: invRejected } } = await getDashboardStats()


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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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

      <StatCharts />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Card Đã Duyệt */}
        <div className="relative overflow-hidden group rounded-3xl p-8 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/20 text-white transition-transform duration-300 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="absolute right-8 bottom-8 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg md:text-xl text-emerald-50">ĐTV Đánh Giá ĐẠT</h3>
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                <CheckCircle size={28} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-black drop-shadow-md mb-2">
                {invApproved}
              </p>
              <p className="text-sm font-medium text-emerald-100 flex items-center gap-1.5 opacity-90">
                Lượt duyệt đạt yêu cầu kiểm định gốc
              </p>
            </div>
          </div>
        </div>

        {/* Card Bị Từ Chối */}
        <div className="relative overflow-hidden group rounded-3xl p-8 bg-gradient-to-br from-rose-500 to-red-700 shadow-xl shadow-rose-500/20 text-white transition-transform duration-300 hover:-translate-y-1">
          <div className="absolute -left-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
          <div className="absolute left-8 bottom-8 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg md:text-xl text-rose-50">ĐTV Đánh Giá KHÔNG ĐẠT</h3>
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                <AlertCircle size={28} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-5xl md:text-6xl font-black drop-shadow-md mb-2">
                {invRejected}
              </p>
              <p className="text-sm font-medium text-rose-100 flex items-center gap-1.5 opacity-90">
                Lượt phản hồi yêu cầu làm rõ, cập nhật
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
