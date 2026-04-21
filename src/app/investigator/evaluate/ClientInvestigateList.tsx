"use client"

import { useState } from "react"
import { evaluateEvidence } from "@/actions/investigator"
import { Loader2, Search, CheckSquare, XSquare, FileText, Filter, XCircle, AlertCircle } from "lucide-react"
import FileAttachments from "@/components/FileAttachments"

export default function ClientInvestigateList({ initialEvidences, programs = [] }: { initialEvidences: any[], programs?: {id: string; name: string}[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})

  // Lọc
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterYear, setFilterYear] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL")
  const [filterProgramId, setFilterProgramId] = useState("")
  const [searchProgramName, setSearchProgramName] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)
  
  // Modal Hồ sơ gốc
  const [modalCriterionId, setModalCriterionId] = useState<string | null>(null)

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


  // Danh sách năm
  const availableYears = Array.from(new Set(initialEvidences.map(ev => ev.criterion.standard.year)))

  const filteredEvidences = initialEvidences.filter(ev => {
    let match = true
    if (filterYear !== "ALL") {
      match = match && ev.criterion.standard.year.toString() === filterYear
    }
    if (filterType !== "ALL") {
      match = match && ev.criterion.standard.type === filterType
    }
    if (filterType === "PROGRAM" && filterProgramId) {
      match = match && ev.criterion.standard.programId === filterProgramId
    }
    if (searchKeyword) {
      match = match && ev.criterion.standard.name.toLowerCase().includes(searchKeyword.toLowerCase())
    }
    return match;
  })

  const pendingEvaluationCount = initialEvidences.filter(ev => 
    !ev.evaluations || ev.evaluations.length === 0 || !ev.evaluations[ev.evaluations.length - 1].isApproved
  ).length

  // -- GROUPING BY CRITERION --
  const groupedCriteria = Array.from(
    filteredEvidences.reduce((map, ev) => {
      const cid = ev.criterion.id
      if (!map.has(cid)) {
        map.set(cid, {
          criterion: ev.criterion,
          evidences: []
        })
      }
      map.get(cid)!.evidences.push(ev)
      return map
    }, new Map<string, { criterion: any, evidences: any[] }>()).values()
  ) as Array<{ criterion: any, evidences: any[] }>

  const handleEvaluateCriterion = async (criterionId: string, isApproved: boolean) => {
    setLoadingId(criterionId)
    try {
      const evsToEvaluate = initialEvidences.filter(e => e.criterion.id === criterionId)
      await Promise.all(evsToEvaluate.map(ev => 
        evaluateEvidence({ 
          evidenceId: ev.id, 
          isApproved, 
          comments: commentInput[criterionId] || "Không có phản hồi thêm" 
        })
      ))
      alert("Đã gửi phản hồi đánh giá thành công!")
      window.location.reload()
    } catch (err) {
      alert("Đã xảy ra lỗi khi gửi đánh giá")
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {pendingEvaluationCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">Có <strong>{pendingEvaluationCount}</strong> minh chứng trong các tiêu chuẩn đang chờ được đánh giá phản hồi (chưa có kết quả hoặc lần trước Không Đạt).</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 relative z-30">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bộ lọc tra cứu Tiêu chí
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tìm theo tên tiêu chí</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchKeyword} 
                onChange={e => setSearchKeyword(e.target.value)} 
                placeholder="Từ khóa tiêu chí..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[150px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Năm</label>
             <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả năm</option>
               {availableYears.map(year => (
                 <option key={year} value={year.toString()}>{year}</option>
               ))}
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Loại kiểm định</label>
             <select value={filterType} onChange={e => { 
                setFilterType(e.target.value); 
                setFilterProgramId(""); 
                setSearchProgramName("");
              }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Tất cả các loại</option>
               <option value="INSTITUTIONAL">Kiểm định Trường</option>
               <option value="PROGRAM">Kiểm định Ngành đào tạo</option>
             </select>
          </div>
          {filterType === "PROGRAM" && (
            <div className="w-[220px] relative">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Chọn Ngành đào tạo</label>
              <input 
                type="text"
                value={searchProgramName}
                onChange={e => {
                  setSearchProgramName(e.target.value);
                  setFilterProgramId("");
                  setShowProgramDropdown(true);
                }}
                onFocus={() => setShowProgramDropdown(true)}
                onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
                placeholder="Tra cứu ngành học..."
              />
              {showProgramDropdown && (
                <div className="absolute z-10 w-[300px] right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {programs.filter((p:any) => p.name.toLowerCase().includes(searchProgramName.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành</div>
                  ) : (
                    programs.filter((p:any) => p.name.toLowerCase().includes(searchProgramName.toLowerCase())).map((p:any) => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setFilterProgramId(p.id);
                          setSearchProgramName(p.name);
                          setShowProgramDropdown(false);
                        }}
                        className={`p-3 text-sm cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${filterProgramId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-[var(--primary)] font-semibold' : ''}`}
                      >
                        {p.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groupedCriteria.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Không tìm thấy tiêu chuẩn</h3>
            <p className="text-slate-500 mt-2">Chưa có minh chứng nào được duyệt bởi cấp giám sát.</p>
          </div>
        ) : (
          groupedCriteria.map(({ criterion, evidences }) => {
            const repEv = evidences[0] // Đại diện để lấy status evaluation
            const cid = criterion.id

            return (
              <div key={cid} className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* Cột thông tin minh chứng */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-md uppercase mb-2 inline-block">
                        {criterion.standard.year} - {criterion.standard.name}
                      </span>
                      <h3 className="font-bold text-xl text-[var(--foreground)] mt-1">{criterion.name}</h3>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 flex justify-between uppercase mb-2">
                        <span>Báo cáo chung từ Cơ sở:</span>
                        <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Có {evidences.length} phần minh chứng</span>
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold italic">
                        {criterion.standard.description || repEv.content}
                      </p>
                      
                      <button 
                        onClick={() => setModalCriterionId(cid)}
                        className="mt-4 inline-flex items-center gap-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-[var(--primary)] font-semibold hover:shadow-md transition-shadow focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <Search size={16} /> Kiểm tra Hồ sơ Gốc
                      </button>
                    </div>
                  </div>

                  {/* Cột đánh giá */}
                  <div className="w-full lg:w-96 bg-white dark:bg-[#0f172a] rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
                      <CheckSquare size={18} className="text-[var(--primary)]" /> Khung Đánh Giá Tổng Thể
                    </h4>
                    
                    {repEv.evaluations && repEv.evaluations.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {repEv.evaluations.map((evalData: any, idx: number) => (
                          <div key={evalData.id} className={`p-4 rounded-xl border-2 ${evalData.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300'}`}>
                            <div className="flex flex-col gap-1.5 mb-2 border-b border-current/10 pb-2">
                              <p className="font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {evalData.isApproved ? <CheckSquare size={16} /> : <XSquare size={16} />}
                                  {evalData.isApproved ? 'KẾT LUẬN: ĐẠT' : 'KẾT LUẬN: KHÔNG ĐẠT'}
                                </span>
                                <span className="text-xs font-normal opacity-70">Lần {idx + 1}</span>
                              </p>
                              <p className="text-[11px] opacity-80 italic">Bởi: <strong>{evalData.evaluator?.name || "Điều tra viên"}</strong> - {new Date(evalData.createdAt).toLocaleDateString('vi-VN')} {new Date(evalData.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            {evalData.comments && (
                              <p className="text-sm rounded-lg opacity-90">{evalData.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!repEv.evaluations || repEv.evaluations.length === 0 || !repEv.evaluations[repEv.evaluations.length - 1].isApproved) && (
                      <div className="space-y-4">
                        <textarea
                          placeholder="Nhập nhận xét / phản hồi của đoàn kiểm tra..."
                          value={commentInput[cid] || ""}
                          onChange={(e) => setCommentInput({ ...commentInput, [cid]: e.target.value })}
                          className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-[var(--primary)] min-h-[100px]"
                        />
                        
                        <div className="flex gap-2">
                          <button 
                            disabled={loadingId === cid}
                            onClick={() => {
                              if (!commentInput[cid]?.trim()) {
                                alert("Vui lòng nhập lý do vì sao không đạt!");
                                return;
                              }
                              handleEvaluateCriterion(cid, false)
                            }}
                            className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 text-red-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {loadingId === cid ? <Loader2 size={16} className="animate-spin" /> : <XSquare size={16} />} 
                            Không đạt
                          </button>
                          <button 
                            disabled={loadingId === cid}
                            onClick={() => handleEvaluateCriterion(cid, true)}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            {loadingId === cid ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />} 
                            Đạt ({evidences.length} MC)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalCriterionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--foreground)]">
                <Search size={20} className="text-[var(--primary)]" /> Toàn bộ Minh chứng liên quan
              </h3>
              <button onClick={() => setModalCriterionId(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                 <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {initialEvidences.filter(e => e.criterionId === modalCriterionId).map(relEv => (
                 <div key={relEv.id} className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                    {relEv.evidenceItem && (
                      <div className="mb-3 inline-block px-3 py-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm font-bold shadow-sm">
                        {relEv.evidenceItem.name}
                      </div>
                    )}
                    <h4 className="text-sm font-semibold mb-2 text-[var(--foreground)]">Nội dung báo cáo chi tiết:</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{relEv.content}</p>
                    
                    <FileAttachments fileStr={relEv.fileUrl} />
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-medium text-slate-500">
                      <span>Nộp bởi: <strong className="text-[var(--foreground)]">{relEv.collaborator?.name}</strong></span>
                      <span>Ngày nộp: {new Date(relEv.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                 </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-right bg-slate-50 dark:bg-slate-800">
               <button onClick={() => setModalCriterionId(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">Đóng lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
