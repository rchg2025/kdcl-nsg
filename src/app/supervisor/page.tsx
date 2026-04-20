import StatCharts from "@/components/dashboard/StatCharts"

export default function SupervisorDashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Tổng quan Giám sát viên</h1>
        <p className="text-slate-500 mt-1">Dữ liệu tổng thể từ hệ thống kiểm định</p>
      </div>
      
      <StatCharts />
    </div>
  )
}
