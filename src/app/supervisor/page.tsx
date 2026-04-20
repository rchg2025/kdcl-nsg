export default function SupervisorDashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Tổng quan Giám sát viên</h1>
        <p className="text-slate-500 mt-1">Quản lý và duyệt minh chứng</p>
      </div>
      
      <div className="glass rounded-2xl p-6 shadow-sm">
        <p className="text-slate-500">Chưa có dữ liệu cần duyệt</p>
      </div>
    </div>
  )
}
