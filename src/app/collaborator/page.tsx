import StatCharts from "@/components/dashboard/StatCharts"

export default function CollaboratorDashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Tổng quan Cộng tác viên</h1>
        <p className="text-slate-500 mt-1">Cập nhật và theo dõi minh chứng của bạn</p>
      </div>
      
      <StatCharts />
    </div>
  )
}
