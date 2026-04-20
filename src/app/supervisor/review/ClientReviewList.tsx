"use client"

import { useState } from "react"
import { updateEvidenceStatus } from "@/actions/supervisor"
import { Loader2, CheckCircle2, Clock, AlertCircle, FileText, UserCircle } from "lucide-react"
import { EvidenceStatus } from "@prisma/client"

export default function ClientReviewList({ initialEvidences }: { initialEvidences: any[] }) {
  const [evidences, setEvidences] = useState(initialEvidences)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, newStatus: EvidenceStatus) => {
    setLoadingId(id)
    try {
      await updateEvidenceStatus(id, newStatus)
      setEvidences(evidences.map(ev => ev.id === id ? { ...ev, status: newStatus } : ev))
    } catch (err) {
      alert("Đã xảy ra lỗi khi duyệt minh chứng")
    } finally {
      setLoadingId(null)
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 size={16} className="text-emerald-500" />
      case "REJECTED": return <AlertCircle size={16} className="text-red-500" />
      default: return <Clock size={16} className="text-amber-500" />
    }
  }

  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    REVIEWING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4">
        {evidences.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không có minh chứng nào</h3>
          </div>
        ) : (
          evidences.map((ev) => (
            <div key={ev.id} className={`glass rounded-xl p-5 border-2 transition-all ${statusColors[ev.status]?.split(' ')[0]} ${statusColors[ev.status]?.split(' ')[3]}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 uppercase">
                      {ev.criterion.standard.year} - {ev.criterion.standard.name}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Tiêu chí: {ev.criterion.name}</span>
                  </div>
                  
                  <div className="bg-white dark:bg-[#0f172a]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-3 shadow-sm">
                    <h4 className="text-sm font-semibold mb-1 text-[var(--foreground)]">Nội dung báo cáo:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {ev.content || "Chưa có nội dung đính kèm"}
                    </p>
                  </div>

                  {ev.fileUrl && (
                    <a href={ev.fileUrl} target="_blank" className="inline-flex items-center gap-2 text-sm text-[var(--primary)] font-medium mt-3 hover:underline">
                      <FileText size={16} /> Xem tệp minh chứng
                    </a>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500">
                    <UserCircle size={14} />
                    <span>Thực hiện bởi: <strong className="text-slate-700 dark:text-slate-300">{ev.collaborator.name}</strong> ({ev.collaborator.email})</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 min-w-[160px]">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Trạng thái duyệt:</div>
                  <select
                    disabled={loadingId === ev.id}
                    value={ev.status}
                    onChange={(e) => handleStatusChange(ev.id, e.target.value as EvidenceStatus)}
                    className={`w-full px-3 py-2.5 rounded-lg border outline-none font-semibold text-xs cursor-pointer shadow-sm ${statusColors[ev.status]}`}
                  >
                    <option value="PENDING" className="bg-white text-slate-900">Chờ duyệt</option>
                    <option value="REVIEWING" className="bg-white text-slate-900">Đang xem xét</option>
                    <option value="APPROVED" className="bg-white text-slate-900">Đạt (Phê duyệt)</option>
                    <option value="REJECTED" className="bg-white text-slate-900">Không đạt (Từ chối)</option>
                  </select>
                  
                  {loadingId === ev.id && (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin" /> Đang lưu...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
