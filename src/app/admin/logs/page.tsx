import { getLogs } from "@/actions/log"
import ClientLogs from "./ClientLogs"

export default async function LogsPage() {
  const logs = await getLogs()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Nhật ký Hệ thống</h1>
        <p className="text-slate-500 mt-1">Lưu trữ hoạt động và thao tác quan trọng trên hệ thống</p>
      </div>
      <ClientLogs logs={logs as any} />
    </div>
  )
}
