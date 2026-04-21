"use client"

import { useState } from "react"
import { CheckCircle2, Clock, AlertCircle, FileText, UserCircle, Search, Filter, CheckSquare, XSquare, Loader2, XCircle } from "lucide-react"
import { evaluateEvidence } from "@/actions/investigator"
import FileAttachments from "@/components/FileAttachments"

export default function ClientInvestigatorEvidenceList({ initialEvidences }: { initialEvidences: any[] }) {
  // Filter & Pagination States
  const [searchUser, setSearchUser] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterYear, setFilterYear] = useState("ALL")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Evaluation States
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})

  const handleEvaluate = async (id: string, isApproved: boolean) => {
    setLoadingId(id)
    try {
      await evaluateEvidence({ 
        evidenceId: id, 
        isApproved, 
        comments: commentInput[id] || "Không có phản hồi thêm" 
      })
      alert("Đã gửi phản hồi đánh giá thành công!")
      window.location.reload()
    } catch (err) {
      alert("Đã xảy ra lỗi khi gửi đánh giá")
      setLoadingId(null)
    }
  }


  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    REVIEWING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
  }

  // Tiện ích danh sách lọc
  const availableYears = Array.from(new Set(initialEvidences.map(ev => ev.criterion.standard.year)))

  // --- FILTERING ---
  const filteredEvidences = initialEvidences.filter(ev => {
    let match = true
    if (searchUser) {
      match = match && ev.collaborator?.name?.toLowerCase().includes(searchUser.toLowerCase())
    }
    if (searchKeyword) {
      match = match && ev.criterion.standard.name.toLowerCase().includes(searchKeyword.toLowerCase())
    }
    if (filterYear !== "ALL") {
      match = match && ev.criterion.standard.year.toString() === filterYear
    }
    return match
  })

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filteredEvidences.length / itemsPerPage))
  const paginatedEvidences = filteredEvidences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const pendingEvaluationCount = initialEvidences.filter(ev => 
    !ev.evaluations || ev.evaluations.length === 0 || !ev.evaluations[ev.evaluations.length - 1].isApproved
  ).length

  return (
    <div className="space-y-6">
      {pendingEvaluationCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">Bạn có <strong>{pendingEvaluationCount}</strong> minh chứng đang chờ được đánh giá phản hồi (chưa có kết quả hoặc lần trước Không Đạt).</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bộ lọc tìm kiếm nâng cao
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nội dung Tiêu chuẩn</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchKeyword} 
                onChange={e => { setSearchKeyword(e.target.value); setCurrentPage(1); }} 
                placeholder="Từ khóa..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[200px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nhân sự thực hiện</label>
             <input 
                type="text" 
                value={searchUser} 
                onChange={e => { setSearchUser(e.target.value); setCurrentPage(1); }} 
                placeholder="Tên nhân sự..." 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
          </div>
          <div className="w-[150px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Năm</label>
             <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả năm</option>
               {availableYears.map(year => (
                 <option key={year} value={year.toString()}>{year}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-stretch">
        {filteredEvidences.length === 0 ? (
          <div className="col-span-full glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không tìm thấy minh chứng nào</h3>
          </div>
        ) : (
          paginatedEvidences.map((ev) => {
            return (
            <div key={ev.id} className={`glass rounded-xl p-5 border-2 flex flex-col justify-between transition-all ${statusColors[ev.status]?.split(' ')[0]} ${statusColors[ev.status]?.split(' ')[3]}`}>
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 uppercase">
                      {ev.criterion.standard.year} - {ev.criterion.standard.name}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">TC: {ev.criterion.name}</span>
                  </div>
                  <div className="px-2 py-1 bg-emerald-500 text-white font-bold text-[10px] rounded flex items-center gap-1 shadow-sm">
                     <CheckCircle2 size={12} /> Đã Duyệt
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

                {/* Frame Đánh giá */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 mb-3">
                    <CheckSquare size={14} className="text-[var(--primary)]" /> Kế quả Đánh giá (Kiểm tra chéo)
                  </h4>
                  
                  {ev.evaluations && ev.evaluations.length > 0 && (
                    <div className="space-y-2.5 mb-3">
                      {ev.evaluations.map((evalData: any, idx: number) => (
                        <div key={evalData.id} className={`p-3 rounded-lg border-2 ${evalData.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300'}`}>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold flex items-center gap-1.5">
                              {evalData.isApproved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                              {evalData.isApproved ? 'HỒ SƠ ĐẠT YÊU CẦU' : 'HỒ SƠ KHÔNG ĐẠT'}
                              <span className="text-[10px] font-normal opacity-70 ml-auto">Lần {idx + 1}</span>
                            </p>
                            <p className="text-[10px] opacity-80 italic">Đánh giá bởi: <strong>{evalData.evaluator?.name || "Điều tra viên"}</strong> lúc {new Date(evalData.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                          {evalData.comments && (
                            <p className="text-[11px] leading-relaxed italic opacity-90 border-t border-current/20 pt-1.5 mt-1.5 break-words whitespace-pre-wrap">
                              {evalData.comments}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(!ev.evaluations || ev.evaluations.length === 0 || !ev.evaluations[ev.evaluations.length - 1].isApproved) && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                      <p className="text-[11px] text-slate-500 mb-2">
                        {(!ev.evaluations || ev.evaluations.length === 0) ? "Hồ sơ chưa có kết quả đánh giá." : "Mời Điều tra viên đánh giá lại hồ sơ (do lần trước Không đạt)."}
                      </p>
                      <textarea
                        disabled={loadingId === ev.id}
                        placeholder="Nhập lý do hoặc nhận xét (bắt buộc nếu Không Đạt)..."
                        className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none mb-2 min-h-[50px] focus:border-indigo-500 shadow-sm"
                        value={commentInput[ev.id] || ""}
                        onChange={e => setCommentInput(prev => ({...prev, [ev.id]: e.target.value}))}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEvaluate(ev.id, true)}
                          disabled={loadingId === ev.id}
                          className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-bold py-1.5 rounded-md flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {loadingId === ev.id ? <Loader2 size={12} className="animate-spin"/> : <CheckSquare size={12}/>} 
                          ĐẠT
                        </button>
                        <button 
                          onClick={() => {
                            if (!commentInput[ev.id]?.trim()) {
                              alert("Vui lòng nhập lý do vì sao không đạt!");
                              return;
                            }
                            handleEvaluate(ev.id, false)
                          }}
                          disabled={loadingId === ev.id}
                          className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold py-1.5 rounded-md flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {loadingId === ev.id ? <Loader2 size={12} className="animate-spin"/> : <XSquare size={12}/>} 
                          KHÔNG ĐẠT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Footer: Metadata */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <UserCircle size={14} className="text-slate-400" /> Nội dung chuẩn bị bởi: <strong>{ev.collaborator.name}</strong>
                  </div>
                </div>
              </div>
            </div>
          )
        })
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
    </div>
  )
}
