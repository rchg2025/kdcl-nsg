"use client"

import React, { useState, useMemo } from "react"
import { CheckCircle2, Clock, AlertCircle, FileText, UserCircle, Search, Filter, CheckSquare, XSquare, Loader2, XCircle, Link2 } from "lucide-react"
import { evaluateEvidence } from "@/actions/investigator"
import FileAttachments from "@/components/FileAttachments"
import { smartSearch } from "@/lib/utils"

export default function ClientInvestigateList({ initialEvidences, programs = [] }: { initialEvidences: any[], programs?: any[] }) {
  // Filter & Pagination States
  const [searchUser, setSearchUser] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterYear, setFilterYear] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL")
  const [filterProgramId, setFilterProgramId] = useState("")
  const [searchProgramName, setSearchProgramName] = useState("")
  const [showProgramDropdown, setShowProgramDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Evaluation States
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [viewingSharedEvidence, setViewingSharedEvidence] = useState<any>(null)
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})

  const handleEvaluate = async (id: string, isApproved: boolean) => {
    setLoadingId(id)
    try {
      await evaluateEvidence({ 
        evidenceId: id, 
        isApproved, 
        comments: commentInput[id] || "KhÃ´ng cÃ³ pháº£n há»“i thÃªm" 
      })
      alert("ÄÃ£ gá»­i pháº£n há»“i Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng!")
      window.location.reload()
    } catch (err) {
      alert("ÄÃ£ xáº£y ra lá»—i khi gá»­i Ä‘Ã¡nh giÃ¡")
      setLoadingId(null)
    }
  }


  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    PENDING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    REVIEWING: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
  }

  // Tiá»‡n Ã­ch danh sÃ¡ch lá»c
  const availableYears = Array.from(new Set(initialEvidences.map(ev => ev.criterion.standard.year)))

  // --- FILTERING ---
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
    if (searchUser) {
      score = Math.min(score, smartSearch(ev.collaborator?.name, searchUser))
    }
    if (searchKeyword && score > 0) {
      score = Math.min(score, smartSearch(ev.criterion.standard.name, searchKeyword))
    }
    return { ev, score }
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.ev)

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filteredEvidences.length / itemsPerPage))
  const paginatedEvidences = filteredEvidences.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const pendingEvaluationCount = initialEvidences.filter(ev => 
    !ev.evaluations || ev.evaluations.length === 0 || !ev.evaluations[ev.evaluations.length - 1].isApproved
  ).length

  
  // Group evidences by Standard -> Criterion
  const groupedEvidences = useMemo(() => {
    const groups: Record<string, {
      standard: any,
      criteria: Record<string, {
        criterion: any,
        evidences: any[]
      }>
    }> = {}

    paginatedEvidences.forEach(ev => {
      const stdKey = `${ev.criterion.standard.name} (${ev.criterion.standard.year})`
      const critKey = ev.criterion.name
      
      if (!groups[stdKey]) {
        groups[stdKey] = {
          standard: ev.criterion.standard,
          criteria: {}
        }
      }
      
      if (!groups[stdKey].criteria[critKey]) {
        groups[stdKey].criteria[critKey] = {
          criterion: ev.criterion,
          evidences: []
        }
      }
      
      groups[stdKey].criteria[critKey].evidences.push(ev)
    })
    
    return groups
  }, [paginatedEvidences])

return (
    <div className="space-y-6">
      {pendingEvaluationCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">Báº¡n cÃ³ <strong>{pendingEvaluationCount}</strong> minh chá»©ng Ä‘ang chá» Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ pháº£n há»“i (chÆ°a cÃ³ káº¿t quáº£ hoáº·c láº§n trÆ°á»›c KhÃ´ng Äáº¡t).</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 relative z-30">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[var(--foreground)]">
          <Filter size={18} /> Bá»™ lá»c tÃ¬m kiáº¿m nÃ¢ng cao
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ná»™i dung TiÃªu chÃ­</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchKeyword} 
                onChange={e => { setSearchKeyword(e.target.value); setCurrentPage(1); }} 
                placeholder="Tá»« khÃ³a..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
            </div>
          </div>
          <div className="w-[200px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">NhÃ¢n sá»± thá»±c hiá»‡n</label>
             <input 
                type="text" 
                value={searchUser} 
                onChange={e => { setSearchUser(e.target.value); setCurrentPage(1); }} 
                placeholder="TÃªn nhÃ¢n sá»±..." 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm" 
              />
          </div>
          <div className="w-[150px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">NÄƒm</label>
             <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Táº¥t cáº£ nÄƒm</option>
               {availableYears.map(year => (
                 <option key={year} value={year.toString()}>{year}</option>
               ))}
             </select>
          </div>
          <div className="w-[180px]">
             <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Loáº¡i Ä‘Ã¡nh giÃ¡</label>
             <select value={filterType} onChange={e => { 
                setFilterType(e.target.value); 
                setFilterProgramId(""); 
                setSearchProgramName("");
                setCurrentPage(1); 
              }} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm">
               <option value="ALL">Táº¥t cáº£ cÃ¡c loáº¡i</option>
               <option value="INSTITUTIONAL">Kiá»ƒm Ä‘á»‹nh TrÆ°á»ng</option>
               <option value="PROGRAM">Kiá»ƒm Ä‘á»‹nh NgÃ nh Ä‘Ã o</option>
             </select>
          </div>
          {filterType === "PROGRAM" && (
            <div className="w-[220px] relative">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Chá»n NgÃ nh Ä‘Ã o táº¡o</label>
              <input 
                type="text"
                value={searchProgramName}
                onChange={e => {
                  setSearchProgramName(e.target.value);
                  setFilterProgramId("");
                  setShowProgramDropdown(true);
                  setCurrentPage(1);
                }}
                onFocus={() => setShowProgramDropdown(true)}
                onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
                placeholder="Tra cá»©u ngÃ nh há»c..."
              />
              {showProgramDropdown && (
                <div className="absolute z-10 w-[300px] right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {programs.filter((p:any) => smartSearch(p.name, searchProgramName) > 0).length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">KhÃ´ng tÃ¬m tháº¥y ngÃ nh</div>
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
                          setCurrentPage(1);
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

      
<div className="grid grid-cols-1 gap-4">
        {filteredEvidences.length === 0 ? (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">KhÃ´ng tÃ¬m tháº¥y minh chá»©ng nÃ o</h3>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Minh chá»©ng</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Tá»‡p Ä‘Ã­nh kÃ¨m</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">ThÃ´ng tin</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right whitespace-nowrap">ÄÃ¡nh giÃ¡</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedEvidences).map(([stdKey, stdGroup]) => (
                  <React.Fragment key={stdKey}>
                    {/* Standard Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="p-3 px-4 font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                        {stdKey}
                      </td>
                    </tr>
                    {Object.entries(stdGroup.criteria).map(([critKey, critGroup]) => (
                      <React.Fragment key={critKey}>
                        {/* Criterion Row */}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-700/60">
                           <td colSpan={4} className="p-2 px-6 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                             {critKey}
                           </td>
                        </tr>
                        {/* Evidence Rows */}
                        {critGroup.evidences.map((ev: any, index: number) => {
                          const bgClass = index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30";
                          const hasSuppInfo = ev.sharedFrom || (ev._count && ev._count.sharedTo > 0);
                          return (
                          <React.Fragment key={ev.id}>
                            <tr id={`ev-${ev.id}`} className={`${bgClass} ${hasSuppInfo ? '' : 'border-b border-slate-200 dark:border-slate-700/50'} hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                              <td className="p-3 pl-10 align-top min-w-[300px] max-w-[400px]">
                                {ev.evidenceItem && (
                                  <div className="mb-2 inline-block px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded text-[11px] font-semibold break-words whitespace-normal">
                                    Minh chá»©ng: {ev.evidenceItem.name}
                                  </div>
                                )}
                                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                  {ev.content || ev.sharedFrom?.content || "KhÃ´ng cÃ³ ná»™i dung mÃ´ táº£"}
                                </div>
                              </td>
                            <td className="p-3 align-top min-w-[200px]">
                               <FileAttachments fileStr={ev.fileUrl || ev.sharedFrom?.fileUrl || null} />
                            </td>
                            <td className="p-3 align-top min-w-[150px]">
                              <div className={`mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${statusColors[ev.status]}`}>
                                <CheckCircle2 size={12} /> ÄÃ£ duyá»‡t
                              </div>
                              <div className="flex flex-col gap-1.5 text-[10px] font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <UserCircle size={12} className="text-slate-400" />
                                  <span>Ná»™p bá»Ÿi: <strong className="text-slate-700 dark:text-slate-300">{ev.collaborator.name}</strong> {ev.collaborator?.department?.name && `(${ev.collaborator.department.name})`}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 align-top text-right min-w-[250px]">
                                <div className="w-full flex flex-col gap-2">
                                  {ev.evaluations && ev.evaluations.length > 0 && (
                                    <div className="flex flex-col gap-2 text-left mb-2">
                                      {ev.evaluations.map((evalData: any, idx: number) => (
                                        <div key={evalData.id} className={`p-2 rounded-lg border-2 ${evalData.isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'} text-xs`}>
                                          <div className="font-bold flex items-center justify-between mb-1">
                                            <span className="flex items-center gap-1">{evalData.isApproved ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {evalData.isApproved ? 'Äáº T' : 'KHÃ”NG Äáº T'}</span>
                                            <span className="opacity-70 text-[9px]">Láº§n {idx + 1}</span>
                                          </div>
                                          {evalData.comments && <p className="opacity-90 italic text-[10px] break-words whitespace-pre-wrap">{evalData.comments}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {(!ev.evaluations || ev.evaluations.length === 0 || !ev.evaluations[ev.evaluations.length - 1].isApproved) && (
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-left">
                                      <textarea
                                        disabled={loadingId === ev.id}
                                        placeholder="Nháº­n xÃ©t (báº¯t buá»™c náº¿u KhÃ´ng Äáº¡t)..."
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
                                          {loadingId === ev.id ? <Loader2 size={12} className="animate-spin"/> : <CheckSquare size={12}/>} Äáº T
                                        </button>
                                        <button 
                                          onClick={() => {
                                            if (!commentInput[ev.id]?.trim()) {
                                              alert("Vui lÃ²ng nháº­p lÃ½ do vÃ¬ sao khÃ´ng Ä‘áº¡t!");
                                              return;
                                            }
                                            handleEvaluate(ev.id, false)
                                          }}
                                          disabled={loadingId === ev.id}
                                          className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold py-1.5 rounded-md flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                        >
                                          {loadingId === ev.id ? <Loader2 size={12} className="animate-spin"/> : <XSquare size={12}/>} KHÃ”NG
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </td>
                            </tr>
                            
                            {/* Supplementary info row */}
                            {hasSuppInfo && (
                              <tr className={`${bgClass} border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}>
                                <td colSpan={4} className="px-3 pb-3 pl-10 pt-1">
                                  <div className="flex flex-col gap-2">
                                    {ev.sharedFrom && (
                                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg py-2 px-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-[12px]">
                                          <Link2 size={14} /> 
                                          <span>DÃ¹ng chung tá»« tiÃªu chÃ­: <strong className="font-bold text-indigo-700 dark:text-indigo-300">{ev.sharedFrom.criterion.name}</strong></span>
                                        </div>
                                        <button 
                                          onClick={() => setViewingSharedEvidence(ev.sharedFrom)}
                                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-md text-[11px] font-bold transition-colors"
                                        >
                                          <Search size={10} /> Xem gá»‘c
                                        </button>
                                      </div>
                                    )}
                                    {ev._count && ev._count.sharedTo > 0 && (
                                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg py-2 px-3">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-[12px]">
                                          <Link2 size={14} /> 
                                          <span>Äang Ä‘Æ°á»£c dÃ¹ng chung cho <strong className="font-bold text-emerald-700 dark:text-emerald-300">{ev._count.sharedTo}</strong> tiÃªu chuáº©n khÃ¡c</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )})}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--card)] px-4 py-3 sm:px-6 rounded-b-2xl mt-4">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Hiá»ƒn thá»‹ <span className="font-medium text-[var(--foreground)]">{((currentPage - 1) * itemsPerPage) + 1}</span> Ä‘áº¿n <span className="font-medium text-[var(--foreground)]">{Math.min(currentPage * itemsPerPage, filteredEvidences.length)}</span> trong sá»‘ <span className="font-medium text-[var(--foreground)]">{filteredEvidences.length}</span> káº¿t quáº£
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang trÆ°á»›c</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-current={currentPage === pageNum ? "page" : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                        currentPage === pageNum
                          ? "z-10 bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                          : "text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang sau</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile Pagination View */}
          <div className="flex flex-1 justify-between sm:hidden mt-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Trang trÆ°á»›c
            </button>
            <span className="text-sm self-center text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
{/* Shared Evidence View Modal */}
      {viewingSharedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[700px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Link2 size={20} className="text-indigo-500" />
                ThÃ´ng tin Minh chá»©ng DÃ¹ng chung
              </h3>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4 text-sm text-slate-500">
                Tá»« tiÃªu chÃ­: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.standard?.name} ({viewingSharedEvidence.criterion?.standard?.year})</strong>
                <br />
                TiÃªu chuáº©n: <strong className="text-indigo-600 dark:text-indigo-400">{viewingSharedEvidence.criterion?.name}</strong>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Ná»™i dung bÃ¡o cÃ¡o:</label>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {viewingSharedEvidence.content || "ChÆ°a cÃ³ ná»™i dung mÃ´ táº£"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">TÃ i liá»‡u Ä‘Ã­nh kÃ¨m:</label>
                <FileAttachments fileStr={viewingSharedEvidence.fileUrl || null} />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setViewingSharedEvidence(null)} 
                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
