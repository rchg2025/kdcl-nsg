"use client"

import React, { useState } from "react"
import { evaluateEvidence } from "@/actions/investigator"
import { Loader2, Search, CheckSquare, XSquare, FileText, Filter, XCircle, AlertCircle } from "lucide-react"
import FileAttachments from "@/components/FileAttachments"
import { smartSearch } from "@/lib/utils"

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

  const filteredEvidences = initialEvidences.map(ev => {
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
    if (!match) return { ev, score: 0 }

    let score = 100
    if (searchKeyword) {
      score = smartSearch(ev.criterion.standard.name, searchKeyword)
    }
    return { ev, score }
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.ev)

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
                  {programs.filter((p:any) => smartSearch(p.name, searchProgramName) > 0).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy ngành</div>
                  ) : (
                    programs.filter((p:any) => smartSearch(p.name, searchProgramName) > 0)
                      .map(_item => ({ _item, _score: smartSearch(_item.name, searchProgramName) }))
  .sort((a, b) => b._score - a._score)
  .map(obj => obj._item)
                      .map((p:any) => (
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
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Minh chứng</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Tệp đính kèm</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Thông tin</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right whitespace-nowrap min-w-[250px]">Đánh giá Tiêu chí</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  groupedCriteria.reduce((map, group) => {
                    const stdKey = `${group.criterion.standard.name} (${group.criterion.standard.year})`;
                    if (!map.has(stdKey)) map.set(stdKey, []);
                    map.get(stdKey)!.push(group);
                    return map;
                  }, new Map<string, typeof groupedCriteria>())
                ).map(([stdKey, criteriaGroups]) => (
                  <React.Fragment key={stdKey}>
                    {/* Standard Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="p-3 px-4 font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                        {stdKey}
                      </td>
                    </tr>
                    
                    {/* Criteria Rows */}
                    {criteriaGroups.map(({ criterion, evidences }) => {
                      const repEv = evidences[0];
                      const cid = criterion.id;
                      
                      return (
                        <React.Fragment key={cid}>
                          <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-700/60">
                            <td colSpan={4} className="p-2 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                              {criterion.name}
                            </td>
                          </tr>
                          
                          {evidences.map((ev: any, index: number) => {
                            const bgClass = index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30";
                            
                            return (
                              <tr key={ev.id} className={`${bgClass} border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td className="p-3 pl-10 align-top min-w-[300px] max-w-[400px]">
                                  {ev.evidenceItem && (
                                    <div className="mb-2 inline-block px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded text-[11px] font-semibold break-words whitespace-normal">
                                      Minh chứng: {ev.evidenceItem.name}
                                    </div>
                                  )}
                                  <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {ev.content || ev.sharedFrom?.content || "Không có nội dung mô tả"}
                                  </div>
                                </td>
                                <td className="p-3 align-top min-w-[200px]">
                                  <FileAttachments fileStr={ev.fileUrl || ev.sharedFrom?.fileUrl || null} />
                                </td>
                                <td className="p-3 align-top min-w-[150px]">
                                  <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-500">
                                    <span>Nộp bởi: <strong className="text-slate-700 dark:text-slate-300">{ev.collaborator.name}</strong></span>
                                  </div>
                                </td>
                                
                                {/* Đánh giá Tiêu chí - Chỉ render ở dòng đầu tiên của Tiêu chí và gộp cột (rowSpan) */}
                                {index === 0 && (
                                  <td className="p-3 align-top text-right min-w-[250px] border-l border-slate-100 dark:border-slate-800" rowSpan={evidences.length}>
                                    <div className="w-full flex flex-col gap-2">
                                      {repEv.evaluations && repEv.evaluations.length > 0 && (
                                        <div className="flex flex-col gap-2 text-left mb-2">
                                          {repEv.evaluations.map((evalData: any, idx: number) => (
                                            <div key={evalData.id} className={`p-2 rounded-lg border-2 ${evalData.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'} text-xs`}>
                                              <div className="font-bold flex items-center justify-between mb-1">
                                                <span className="flex items-center gap-1">{evalData.isApproved ? <CheckSquare size={12} /> : <XCircle size={12} />} {evalData.isApproved ? 'ĐẠT' : 'KHÔNG ĐẠT'}</span>
                                                <span className="opacity-70 text-[9px]">Lần {idx + 1}</span>
                                              </div>
                                              {evalData.comments && <p className="opacity-90 italic text-[10px] break-words whitespace-pre-wrap">{evalData.comments}</p>}
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {(!repEv.evaluations || repEv.evaluations.length === 0 || !repEv.evaluations[repEv.evaluations.length - 1].isApproved) && (
                                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-left">
                                          <textarea
                                            disabled={loadingId === cid}
                                            placeholder="Nhận xét (bắt buộc nếu Không Đạt)..."
                                            className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none mb-2 min-h-[50px] focus:border-indigo-500 shadow-sm"
                                            value={commentInput[cid] || ""}
                                            onChange={e => setCommentInput(prev => ({...prev, [cid]: e.target.value}))}
                                          />
                                          <div className="flex gap-2">
                                            <button 
                                              onClick={() => handleEvaluateCriterion(cid, true)}
                                              disabled={loadingId === cid}
                                              className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-bold py-1.5 rounded-md flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                            >
                                              {loadingId === cid ? <Loader2 size={12} className="animate-spin"/> : <CheckSquare size={12}/>} ĐẠT
                                            </button>
                                            <button 
                                              onClick={() => {
                                                if (!commentInput[cid]?.trim()) {
                                                  alert("Vui lòng nhập lý do vì sao không đạt!");
                                                  return;
                                                }
                                                handleEvaluateCriterion(cid, false)
                                              }}
                                              disabled={loadingId === cid}
                                              className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold py-1.5 rounded-md flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                            >
                                              {loadingId === cid ? <Loader2 size={12} className="animate-spin"/> : <XSquare size={12}/>} KHÔNG
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
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
