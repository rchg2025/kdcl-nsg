"use client"

import { useState } from "react"
import { updateEvidenceStatus } from "@/actions/supervisor"
import { Loader2, CheckCircle2, Clock, AlertCircle, FileText, UserCircle, XCircle } from "lucide-react"
import { EvidenceStatus } from "@prisma/client"

export default function ClientReviewList({ initialEvidences }: { initialEvidences: any[] }) {
  const [evidences, setEvidences] = useState(initialEvidences)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const handleStatusChange = async (id: string, newStatus: EvidenceStatus, reason?: string) => {
    if (newStatus === "REJECTED") {
      setRejectModalId(id)
      setRejectReason("")
      return
    }
    
    setLoadingId(id)
    try {
      await updateEvidenceStatus(id, newStatus)
      setEvidences(evidences.map(ev => ev.id === id ? { ...ev, status: newStatus, rejectReason: null } : ev))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi duyệt minh chứng")
    } finally {
      setLoadingId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectModalId) return
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối!")

    setLoadingId(rejectModalId)
    setRejectModalId(null)
    try {
      await updateEvidenceStatus(rejectModalId, "REJECTED" as EvidenceStatus, rejectReason.trim())
      setEvidences(evidences.map(ev => ev.id === rejectModalId ? { ...ev, status: "REJECTED", rejectReason: rejectReason.trim() } : ev))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi từ chối minh chứng")
    } finally {
      setLoadingId(null)
      setRejectReason("")
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
                    <span className="text-xs font-bold text-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Tiêu chí: {ev.criterion.name}</span>
                  </div>
                  {ev.evidenceItem && (
                    <div className="mb-3 inline-block px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs font-bold shadow-sm">
                      Danh mục nộp: {ev.evidenceItem.name}
                    </div>
                  )}
                  
                  <div className="bg-white dark:bg-[#0f172a]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-1 shadow-sm">
                    <h4 className="text-sm font-semibold mb-1 text-[var(--foreground)]">Nội dung báo cáo:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {ev.content || "Chưa có nội dung đính kèm"}
                    </p>
                  </div>

                  {ev.fileUrl && (
                    <div className="mt-3 flex flex-col gap-1">
                      {ev.fileUrl.split(", ").map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" className="inline-flex w-fit items-center gap-2 text-sm text-[var(--primary)] font-medium hover:underline">
                          <FileText size={16} /> Xem tệp minh chứng {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Show rejection reason if rejected */}
                  {ev.status === "REJECTED" && ev.rejectReason && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs mb-1">
                        <XCircle size={14} /> Lý do từ chối:
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">{ev.rejectReason}</p>
                    </div>
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

      {/* Rejection reason modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Từ chối Minh chứng</h3>
                <p className="text-xs text-slate-500">Nhập lý do để CTV biết cần sửa gì</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Lý do từ chối <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[100px] text-sm"
                  placeholder="Ví dụ: Thiếu tài liệu chứng minh, cần bổ sung biên bản họp..."
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRejectModalId(null); setRejectReason("") }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} /> Xác nhận Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
