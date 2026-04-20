import { 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react"

export default function AdminDashboardPage() {
  const stats = [
    { title: "Tổng số thành viên", value: "24", icon: Users, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Tiêu chí đã duyệt", value: "142", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Tiêu chí chưa đạt", value: "18", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
    { title: "Tổng tiêu chuẩn", value: "10", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tổng quan hệ thống</h1>
          <p className="text-slate-500 mt-1">Nắm bắt thông tin Kiểm định chất lượng nhanh chóng</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 shadow-sm">
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
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Tiến độ cập nhật theo năm</h3>
          <div className="w-full h-64 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 text-sm">Biểu đồ sẽ hiển thị ở đây</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Hoạt động gần đây</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 text-center py-8">Chưa có hoạt động nào</p>
          </div>
        </div>
      </div>
    </div>
  )
}
