"use client"

import { useState } from "react"
import { updateEvidenceStatus, deleteEvidenceAsAdmin } from "@/actions/supervisor"
import { Loader2, CheckCircle2, Clock, AlertCircle, FileText, UserCircle, XCircle, Edit2, Search, Filter, Calendar } from "lucide-react"
import { EvidenceStatus } from "@prisma/client"
import FileAttachments from "@/components/FileAttachments"

export default function ClientReviewList({ initialEvidences, isAdmin = false }: { initialEvidences: any[], isAdmin?: boolean }) {
  const [evidences, setEvidences] = useState(initialEvidences)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // Filter & Pagination States
  const [searchUser, setSearchUser] = useState("")
  const [searchDepartment, setSearchDepartment] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

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
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do không đạt!")

    setLoadingId(rejectModalId)
    setRejectModalId(null)
    try {
      await updateEvidenceStatus(rejectModalId, "REJECTED" as EvidenceStatus, rejectReason.trim())
      setEvidences(evidences.map(ev => ev.id === rejectModalId ? { ...ev, status: "REJECTED", rejectReason: rejectReason.trim() } : ev))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi không đạt minh chứng")
    } finally {
      setLoadingId(null)
      setRejectReason("")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn XÓA BỎ HOÀN TOÀN minh chứng này? Thao tác này không thể hoàn tác!")) return
    
    setLoadingId(id)
    try {
      await deleteEvidenceAsAdmin(id)
      setEvidences(evidences.filter(ev => ev.id !== id))
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi xóa minh chứng")
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

  // --- FILTERING ---
  const filteredEvidences = evidences.filter(ev => {
    let match = true
    if (searchUser) {
      const q = searchUser.toLowerCase()
      const nameMatch = ev.collaborator?.name?.toLowerCase().includes(q)
      const emailMatch = ev.collaborator?.email?.toLowerCase().includes(q)
      const criterionMatch = ev.criterion?.name?.toLowerCase().includes(q)
      const stdMatch = ev.criterion?.standard?.name?.toLowerCase().includes(q)
      const itemMatch = ev.evidenceItem?.name?.toLowerCase().includes(q)
      
      match = match && (nameMatch || emailMatch || criterionMatch || stdMatch || itemMatch)
    }
    if (searchDepartment !== "ALL") {
      match = match && ev.collaborator?.department?.name === searchDepartment
    }
    if (statusFilter !== "ALL") {
      match = match && ev.status === statusFilter
    }
    if (startDate) {
      match = match && new Date(ev.createdAt) >= new Date(startDate)
    }
    if (endDate) {
      const endD = new Date(endDate)
      endD.setHours(23, 59, 59, 999)
      match = match && new Date(ev.createdAt) <= endD
    }
    return match
  })

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filteredEvidences.length / itemsPerPage))
  const paginatedEvidences = filteredEvidences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const departments = Array.from(new Set(evidences.map(ev => ev.collaborator?.department?.name).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bộ lọc tìm kiếm nâng cao
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tìm kiếm</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchUser} 
                onChange={e => { setSearchUser(e.target.value); setCurrentPage(1); }} 
                placeholder="Tên NV, Email, Tên tiêu chuẩn, Tên minh chứng..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Trạng thái</label>
             <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả trạng thái</option>
               <option value="PENDING">Chờ duyệt</option>
               <option value="REVIEWING">Đang xem xét</option>
               <option value="APPROVED">Đạt (Phê duyệt)</option>
               <option value="REJECTED">Không đạt</option>
             </select>
          </div>
          {departments.length > 0 && (
             <div className="w-[200px]">
               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Đơn vị / Phòng ban</label>
               <select value={searchDepartment} onChange={e => { setSearchDepartment(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
                 <option value="ALL">Tất cả đơn vị</option>
                 {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
               </select>
             </div>
          )}
          <div className="w-auto flex items-center gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Từ ngày</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} className="w-[130px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
            <div className="pt-6 text-slate-400">-</div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Đến ngày</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} className="w-[130px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-stretch">
        {filteredEvidences.length === 0 ? (
          <div className="col-span-full glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không tìm thấy minh chứng nào</h3>
          </div>
        ) : (
          paginatedEvidences.map((ev) => (
            <div key={ev.id} className={`glass rounded-xl p-5 border-2 flex flex-col justify-between transition-all ${statusColors[ev.status]?.split(' ')[0]} ${statusColors[ev.status]?.split(' ')[3]}`}>
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ev.criterion.standard.type === "PROGRAM" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded uppercase">
                        Ngành {ev.criterion.standard.program?.name || "???"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded uppercase">
                        Cấp Trường
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 uppercase">
                      {ev.criterion.standard.year} - {ev.criterion.standard.name}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Tiêu chuẩn: {ev.criterion.name}</span>
                  </div>
                </div>

                {ev.evidenceItem && (
                  <div className="mb-3 inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded text-xs font-bold shadow-sm">
                    {ev.evidenceItem.name}
                  </div>
                )}
                
                <div className="bg-white dark:bg-[#0f172a]/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm min-h-[80px]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                    {ev.content || "Chưa có nội dung mô tả"}
                  </p>
                </div>

                  <FileAttachments fileStr={ev.fileUrl} />

                {ev.evaluations && ev.evaluations.filter((e: any) => !e.isApproved).length > 0 && (
                  <div className="mt-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-sm mb-1.5">
                      <AlertCircle size={16} /> Điều tra viên đánh giá KHÔNG ĐẠT
                    </div>
                    {ev.evaluations.filter((e: any) => !e.isApproved).map((evaluation: any, idx: number) => (
                       <div key={evaluation.id} className="mb-2 last:mb-0">
                         <p className="text-[11px] opacity-80 text-red-600 dark:text-red-400">
                           <strong>{evaluation.evaluator?.name || "Điều tra viên"}</strong> - {new Date(evaluation.createdAt).toLocaleString('vi-VN')}
                         </p>
                         <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                           Lý do lần {idx + 1}: {evaluation.comments || "Không có phản hồi thêm"}
                         </p>
                       </div>
                    ))}
                  </div>
                )}

                {ev.status === "REJECTED" && ev.rejectReason && (
                  <div className="mt-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold text-xs mb-1">
                      <XCircle size={12} /> Giám sát viên không đạt:
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 line-clamp-2">{ev.rejectReason}</p>
                  </div>
                )}
              </div>
              
              {/* Card Footer: Metadata and Status Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <UserCircle size={12} className="text-slate-400" />
                    <span>Nộp bởi: <strong className="text-slate-700 dark:text-slate-300">{ev.collaborator.name}</strong> {ev.collaborator?.department?.name && `(${ev.collaborator.department.name})`}</span>
                  </div>
                  {ev.reviewer && ev.reviewedAt && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Duyệt bởi <strong className="text-slate-700 dark:text-slate-300">{ev.reviewer.name}</strong> ({new Date(ev.reviewedAt).toLocaleDateString("vi-VN")})</span>
                    </div>
                  )}
                  {ev.lastUpdater && ev.updatedAt && (
                    <div className="flex items-center gap-1.5">
                      <Edit2 size={12} className="text-blue-500" />
                      <span>Cập nhật bởi <strong className="text-slate-700 dark:text-slate-300">{ev.lastUpdater.name}</strong> ({new Date(ev.updatedAt).toLocaleDateString("vi-VN")})</span>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                  <div className="relative w-full sm:w-[150px]">
                    <select
                      disabled={loadingId === ev.id}
                      value={ev.status}
                      onChange={(e) => handleStatusChange(ev.id, e.target.value as EvidenceStatus)}
                      className={`w-full px-3 py-2 rounded-lg border outline-none font-bold text-xs cursor-pointer shadow-sm appearance-none pr-8 ${statusColors[ev.status]}`}
                    >
                      <option value="PENDING" className="bg-white text-slate-900">Chờ duyệt</option>
                      <option value="REVIEWING" className="bg-white text-slate-900">Đang xem xét</option>
                      <option value="APPROVED" className="bg-white text-slate-900">Phê duyệt</option>
                      <option value="REJECTED" className="bg-white text-slate-900">Không đạt</option>
                    </select>
                    {loadingId === ev.id ? (
                      <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
                    ) : (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(ev.id)}
                      disabled={loadingId === ev.id}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-bold rounded-lg text-xs transition-colors shadow-sm whitespace-nowrap"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
          >
            Trang trước
          </button>
          
          <div className="flex items-center gap-1.5 px-3">
             {Array.from({length: totalPages}).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                  {i + 1}
                </button>
             ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
          >
            Trang tiếp
          </button>
        </div>
      )}

      {/* Rejection reason modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Không đạt Minh chứng</h3>
                <p className="text-xs text-slate-500">Nhập lý do để CTV biết cần sửa gì</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Lý do không đạt <span className="text-red-500">*</span></label>
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
                  <XCircle size={16} /> Xác nhận Không đạt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
