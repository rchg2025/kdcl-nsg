"use client"

import { Clock, ShieldAlert, FileText, UserPlus, FileEdit, Trash2, CheckCircle2 } from "lucide-react"

export default function ClientLogs({ logs }: { logs: any[] }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <UserPlus size={16} className="text-emerald-500" />
      case "UPDATE": return <FileEdit size={16} className="text-amber-500" />
      case "DELETE": return <Trash2 size={16} className="text-rose-500" />
      case "APPROVE": return <CheckCircle2 size={16} className="text-blue-500" />
      default: return <FileText size={16} className="text-slate-500" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "CREATE": return "Tạo mới"
      case "UPDATE": return "Cập nhật"
      case "DELETE": return "Xóa"
      case "APPROVE": return "Kiểm duyệt"
      default: return action
    }
  }

  return (
    <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <th className="p-4 font-bold">Thời gian</th>
              <th className="p-4 font-bold">Người thực hiện</th>
              <th className="p-4 font-bold">Hành động</th>
              <th className="p-4 font-bold">Đối tượng</th>
              <th className="p-4 font-bold">Chi tiết (JSON)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có nhật ký lưu vết nào.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                  </td>
                  <td className="p-4 font-medium">
                    {log.user ? (
                      <div className="flex flex-col">
                        <span>{log.user.name}</span>
                        <span className="text-xs text-slate-400">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Hệ thống</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 w-fit">
                      {getActionIcon(log.action)}
                      {getActionText(log.action)}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                    {log.resource}
                  </td>
                  <td className="p-4 text-slate-500 text-xs font-mono max-w-xs truncate" title={log.details}>
                    {log.details || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
